import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import {
  BoardTile,
  CHANCE_CARDS,
  CHEST_CARDS,
  ChatMessage,
  ClientToServerEvent,
  JAKSEL_TILES,
  JAIL_FINE,
  JAIL_TILE_INDEX,
  JakselCard,
  PASS_START_BONUS,
  PLAYER_TOKENS,
  Player,
  PropertyState,
  PublicRoomSummary,
  RoomState,
  STARTING_CASH,
  ServerToClientEvent,
  TOTAL_TILES,
  TokenId,
  calculateNetWorth,
  calculateRent,
  formatRp,
  getDistrictTiles,
} from './src/shared/jakselBoard.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOT_NAMES = ['Raka (Bot)', 'Sinta (Bot)', 'Dito (Bot)', 'Nadia (Bot)'];

interface ClientMeta {
  ws: WebSocket;
  roomId: string | null;
  playerId: string | null;
  clientId: string | null;
}

interface InternalRoom {
  state: RoomState;
  clients: Set<ClientMeta>;
  botTimer: ReturnType<typeof setTimeout> | null;
  chanceIndex: number;
  chestIndex: number;
}

const rooms = new Map<string, InternalRoom>();

function makeId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function createInitialProperties(): Record<number, PropertyState> {
  const props: Record<number, PropertyState> = {};
  for (const tile of JAKSEL_TILES) {
    if (
      tile.category === 'PROPERTY' ||
      tile.category === 'TRANSIT' ||
      tile.category === 'UTILITY'
    ) {
      props[tile.index] = {
        ownerId: null,
        houses: 0,
        mortgaged: false,
      };
    }
  }
  return props;
}

function createRoom(roomId: string, hostPlayer: Player): InternalRoom {
  const room: InternalRoom = {
    state: {
      roomId,
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      players: [hostPlayer],
      properties: createInitialProperties(),
      currentTurnIndex: 0,
      turnCount: 1,
      lastRoll: null,
      lastRollWasDouble: false,
      freeParkingPot: 100,
      winnerId: null,
      chat: [],
      lastMove: null,
      lastCard: null,
      actionBanner: 'Menunggu pemain bergabung di lobi meja...',
    },
    clients: new Set(),
    botTimer: null,
    chanceIndex: 0,
    chestIndex: 0,
  };
  rooms.set(roomId, room);
  return room;
}

function pickAvailableToken(players: Player[], preferred?: TokenId): TokenId {
  const taken = new Set(players.map((p) => p.token));
  if (preferred && !taken.has(preferred)) return preferred;
  const free = PLAYER_TOKENS.find((t) => !taken.has(t.id));
  return free ? free.id : PLAYER_TOKENS[players.length % PLAYER_TOKENS.length].id;
}

function getTokenConfig(token: TokenId) {
  return PLAYER_TOKENS.find((t) => t.id === token) ?? PLAYER_TOKENS[0];
}

function sendToClient(ws: WebSocket, event: ServerToClientEvent): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(event));
  }
}

function broadcastState(room: InternalRoom): void {
  for (const client of room.clients) {
    sendToClient(client.ws, {
      type: 'room:state',
      payload: {
        state: room.state,
        yourPlayerId: client.playerId,
      },
    });
  }
}

function pushSystemChat(room: InternalRoom, text: string): void {
  const msg: ChatMessage = {
    id: makeId('sys'),
    senderId: 'system',
    senderName: 'Sistem Meja',
    senderColor: '#E5A93C',
    text,
    timestamp: Date.now(),
    type: 'system',
  };
  room.state.chat = [...room.state.chat.slice(-79), msg];
  for (const client of room.clients) {
    sendToClient(client.ws, { type: 'chat:message', payload: msg });
  }
}

function getCurrentPlayer(room: InternalRoom): Player | undefined {
  return room.state.players[room.state.currentTurnIndex];
}

function clearBotTimer(room: InternalRoom): void {
  if (room.botTimer) {
    clearTimeout(room.botTimer);
    room.botTimer = null;
  }
}

function checkWinner(room: InternalRoom): boolean {
  const alive = room.state.players.filter((p) => !p.bankrupt);
  if (alive.length <= 1 && room.state.players.length > 1) {
    const winner = alive[0] ?? room.state.players[0];
    room.state.phase = 'GAME_OVER';
    room.state.winnerId = winner?.id ?? null;
    room.state.actionBanner = `${winner?.name ?? 'Pemain'} menguasai seluruh Jakarta Selatan!`;
    pushSystemChat(room, `Permainan selesai! ${winner?.name} keluar sebagai pemenang.`);
    clearBotTimer(room);
    return true;
  }
  return false;
}

function settleDebt(room: InternalRoom, player: Player, amount: number, creditor?: Player): void {
  player.cash -= amount;
  if (creditor) {
    creditor.cash += amount;
  }

  // Auto-liquidate houses or mortgage properties if cash drops below 0
  if (player.cash < 0) {
    for (const tile of JAKSEL_TILES) {
      if (player.cash >= 0) break;
      const prop = room.state.properties[tile.index];
      if (prop && prop.ownerId === player.id && prop.houses > 0 && tile.houseCost) {
        while (prop.houses > 0 && player.cash < 0) {
          prop.houses -= 1;
          player.cash += Math.floor(tile.houseCost * 0.5);
        }
      }
    }
    for (const tile of JAKSEL_TILES) {
      if (player.cash >= 0) break;
      const prop = room.state.properties[tile.index];
      if (prop && prop.ownerId === player.id && !prop.mortgaged && tile.price) {
        prop.mortgaged = true;
        player.cash += Math.floor(tile.price * 0.5);
      }
    }
  }

  if (player.cash < 0) {
    player.bankrupt = true;
    player.cash = 0;
    for (const key of Object.keys(room.state.properties)) {
      const idx = Number(key);
      if (room.state.properties[idx].ownerId === player.id) {
        room.state.properties[idx] = { ownerId: null, houses: 0, mortgaged: false };
      }
    }
    pushSystemChat(room, `${player.name} dinyatakan bangkrut dan asetnya kembali dilelang.`);
    checkWinner(room);
  }
}

function sendPlayerToJail(room: InternalRoom, player: Player, reason: string): void {
  player.position = JAIL_TILE_INDEX;
  player.inJail = true;
  player.jailTurns = 0;
  player.consecutiveDoubles = 0;
  room.state.lastRollWasDouble = false;
  room.state.actionBanner = `${player.name} terjebak Macet Rasuna Said (Penjara)!`;
  pushSystemChat(room, `${player.name} masuk Penjara Rasuna Said (${reason}).`);
}

function resolveLanding(room: InternalRoom, player: Player, diceSum: number): void {
  const tile: BoardTile = JAKSEL_TILES[player.position];
  room.state.lastCard = null;

  if (tile.category === 'START') {
    room.state.actionBanner = `${player.name} tepat di Bundaran Senayan.`;
    room.state.phase = 'END_TURN';
    return;
  }

  if (tile.category === 'JAIL') {
    room.state.actionBanner = `${player.name} hanya melintas di Rasuna Said.`;
    room.state.phase = 'END_TURN';
    return;
  }

  if (tile.category === 'GOTO_JAIL') {
    room.state.lastMove = {
      sequenceId: makeId('mv'),
      playerId: player.id,
      steps: [tile.index, JAIL_TILE_INDEX],
      passedStart: false,
    };
    sendPlayerToJail(room, player, 'Tilang ETLE');
    if (room.state.phase !== 'GAME_OVER') {
      room.state.phase = 'END_TURN';
    }
    return;
  }

  if (tile.category === 'PARKING') {
    const pot = room.state.freeParkingPot;
    if (pot > 0) {
      player.cash += pot;
      room.state.freeParkingPot = 0;
      room.state.actionBanner = `${player.name} santai di Taman Literasi & klaim ${formatRp(pot)}!`;
      pushSystemChat(room, `${player.name} mengambil dana Parkir Gratis sebesar ${formatRp(pot)}.`);
    } else {
      room.state.actionBanner = `${player.name} beristirahat sejenak di Taman Literasi.`;
    }
    room.state.phase = 'END_TURN';
    return;
  }

  if (tile.category === 'TAX') {
    const tax = tile.taxAmount ?? 100;
    room.state.freeParkingPot += tax;
    settleDebt(room, player, tax);
    room.state.actionBanner = `${player.name} membayar ${tile.name} sebesar ${formatRp(tax)}.`;
    pushSystemChat(room, `${player.name} membayar pajak ${formatRp(tax)} ke kas Taman Literasi.`);
    if (room.state.phase !== 'GAME_OVER') {
      room.state.phase = 'END_TURN';
    }
    return;
  }

  if (tile.category === 'CHANCE' || tile.category === 'CHEST') {
    const isChance = tile.category === 'CHANCE';
    const deck = isChance ? CHANCE_CARDS : CHEST_CARDS;
    const card: JakselCard = isChance
      ? deck[room.chanceIndex++ % deck.length]
      : deck[room.chestIndex++ % deck.length];

    room.state.lastCard = {
      id: makeId('crd'),
      playerId: player.id,
      playerName: player.name,
      card,
    };

    pushSystemChat(room, `${player.name} membuka kartu ${isChance ? 'Kesempatan' : 'Dana Komunitas'}: "${card.title}".`);
    applyCardEffect(room, player, card, diceSum);
    return;
  }

  // Buyable properties (PROPERTY, TRANSIT, UTILITY)
  const propState = room.state.properties[tile.index];
  if (!propState) {
    room.state.phase = 'END_TURN';
    return;
  }

  if (!propState.ownerId) {
    if (player.cash >= (tile.price ?? 0)) {
      room.state.phase = 'BUY_DECISION';
      room.state.actionBanner = `${tile.name} tersedia seharga ${formatRp(tile.price ?? 0)}.`;
    } else {
      room.state.phase = 'END_TURN';
      room.state.actionBanner = `${player.name} mendarat di ${tile.name}, dana belum mencukupi.`;
    }
    return;
  }

  if (propState.ownerId === player.id) {
    room.state.actionBanner = `${player.name} singgah di properti sendiri (${tile.name}).`;
    room.state.phase = 'END_TURN';
    return;
  }

  if (propState.mortgaged) {
    room.state.actionBanner = `${tile.name} sedang digadaikan, bebas biaya sewa.`;
    room.state.phase = 'END_TURN';
    return;
  }

  const owner = room.state.players.find((p) => p.id === propState.ownerId);
  if (!owner || owner.bankrupt) {
    room.state.phase = 'END_TURN';
    return;
  }

  const rent = calculateRent(tile, propState, room.state.properties, diceSum);
  settleDebt(room, player, rent, owner);
  room.state.actionBanner = `${player.name} membayar sewa ${tile.name} ${formatRp(rent)} ke ${owner.name}.`;
  pushSystemChat(room, `${player.name} bayar sewa ${tile.name} sebesar ${formatRp(rent)} kepada ${owner.name}.`);
  if (room.state.phase !== 'GAME_OVER') {
    room.state.phase = 'END_TURN';
  }
}

function applyCardEffect(
  room: InternalRoom,
  player: Player,
  card: JakselCard,
  diceSum: number
): void {
  const eff = card.effect;
  if (eff.type === 'CASH') {
    if (eff.amount >= 0) {
      player.cash += eff.amount;
      room.state.actionBanner = `${card.title}: ${player.name} menerima ${formatRp(eff.amount)}.`;
    } else {
      const abs = Math.abs(eff.amount);
      room.state.freeParkingPot += abs;
      settleDebt(room, player, abs);
      room.state.actionBanner = `${card.title}: ${player.name} membayar ${formatRp(abs)}.`;
    }
    if (room.state.phase !== 'GAME_OVER') room.state.phase = 'END_TURN';
    return;
  }

  if (eff.type === 'COLLECT_FROM_ALL') {
    let total = 0;
    for (const other of room.state.players) {
      if (other.id !== player.id && !other.bankrupt) {
        const pay = Math.min(other.cash, eff.amount);
        other.cash -= pay;
        total += pay;
      }
    }
    player.cash += total;
    room.state.actionBanner = `${card.title}: ${player.name} mengumpulkan ${formatRp(total)}.`;
    room.state.phase = 'END_TURN';
    return;
  }

  if (eff.type === 'JAIL_FREE') {
    player.jailFreeCards += 1;
    room.state.actionBanner = `${player.name} mendapat Kartu Bebas Tilang ETLE!`;
    room.state.phase = 'END_TURN';
    return;
  }

  if (eff.type === 'JAIL') {
    room.state.lastMove = {
      sequenceId: makeId('mv'),
      playerId: player.id,
      steps: [player.position, JAIL_TILE_INDEX],
      passedStart: false,
    };
    sendPlayerToJail(room, player, card.title);
    if (room.state.phase !== 'GAME_OVER') room.state.phase = 'END_TURN';
    return;
  }

  if (eff.type === 'MOVE_TO') {
    const startPos = player.position;
    const steps: number[] = [];
    let cur = startPos;
    let passedStart = false;
    while (cur !== eff.tileIndex) {
      cur = (cur + 1) % TOTAL_TILES;
      if (cur === 0 && eff.collectStart) {
        passedStart = true;
      }
      steps.push(cur);
    }
    if (steps.length === 0) steps.push(eff.tileIndex);
    if (passedStart) {
      player.cash += PASS_START_BONUS;
      pushSystemChat(room, `${player.name} melewati Mulai dan menerima ${formatRp(PASS_START_BONUS)}.`);
    }
    player.position = eff.tileIndex;
    room.state.lastMove = {
      sequenceId: makeId('mv'),
      playerId: player.id,
      steps,
      passedStart,
    };
    resolveLanding(room, player, diceSum);
    return;
  }

  if (eff.type === 'MOVE_REL') {
    const startPos = player.position;
    const target = (startPos + eff.steps + TOTAL_TILES) % TOTAL_TILES;
    player.position = target;
    room.state.lastMove = {
      sequenceId: makeId('mv'),
      playerId: player.id,
      steps: [startPos, target],
      passedStart: false,
    };
    resolveLanding(room, player, diceSum);
  }
}

function advanceTurn(room: InternalRoom): void {
  if (room.state.phase === 'GAME_OVER') return;
  const current = getCurrentPlayer(room);

  // Extra turn on doubles if not in jail
  if (
    current &&
    !current.bankrupt &&
    !current.inJail &&
    room.state.lastRollWasDouble &&
    current.consecutiveDoubles > 0
  ) {
    room.state.phase = 'ROLL';
    room.state.actionBanner = `${current.name} mendapat angka kembar! Lempar dadu lagi.`;
    scheduleBotIfNeeded(room);
    return;
  }

  const total = room.state.players.length;
  let nextIdx = room.state.currentTurnIndex;
  for (let i = 0; i < total; i++) {
    nextIdx = (nextIdx + 1) % total;
    if (!room.state.players[nextIdx].bankrupt) {
      break;
    }
  }

  room.state.currentTurnIndex = nextIdx;
  room.state.turnCount += 1;
  room.state.lastRollWasDouble = false;
  room.state.phase = 'ROLL';
  const nextPlayer = room.state.players[nextIdx];
  room.state.actionBanner = `Giliran ${nextPlayer.name} — siap melempar dadu.`;
  scheduleBotIfNeeded(room);
}

function performRollDice(room: InternalRoom, player: Player): void {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const sum = d1 + d2;
  const isDouble = d1 === d2;

  room.state.lastRoll = [d1, d2];
  room.state.lastRollWasDouble = isDouble;

  if (player.inJail) {
    if (isDouble) {
      player.inJail = false;
      player.jailTurns = 0;
      player.consecutiveDoubles = 0;
      room.state.lastRollWasDouble = false;
      pushSystemChat(room, `${player.name} melempar kembar (${d1}+${d2}) dan bebas dari Macet Rasuna Said!`);
    } else {
      player.jailTurns += 1;
      if (player.jailTurns >= 3) {
        settleDebt(room, player, JAIL_FINE);
        player.inJail = false;
        player.jailTurns = 0;
        pushSystemChat(room, `${player.name} membayar denda ${formatRp(JAIL_FINE)} dan keluar dari Penjara.`);
        if (room.state.phase === 'GAME_OVER') return;
      } else {
        room.state.actionBanner = `${player.name} melempar ${d1}+${d2}, masih tertahan di Rasuna Said (${player.jailTurns}/3).`;
        pushSystemChat(room, `${player.name} gagal mendapat angka kembar (${d1}+${d2}) di Penjara.`);
        room.state.phase = 'END_TURN';
        return;
      }
    }
  } else {
    if (isDouble) {
      player.consecutiveDoubles += 1;
      if (player.consecutiveDoubles >= 3) {
        room.state.lastMove = {
          sequenceId: makeId('mv'),
          playerId: player.id,
          steps: [player.position, JAIL_TILE_INDEX],
          passedStart: false,
        };
        sendPlayerToJail(room, player, '3x Angka Kembar Berturut-turut');
        room.state.phase = 'END_TURN';
        return;
      }
    } else {
      player.consecutiveDoubles = 0;
    }
  }

  const startPos = player.position;
  const steps: number[] = [];
  let passedStart = false;
  for (let i = 1; i <= sum; i++) {
    const pos = (startPos + i) % TOTAL_TILES;
    if (pos === 0) passedStart = true;
    steps.push(pos);
  }

  if (passedStart) {
    player.cash += PASS_START_BONUS;
    pushSystemChat(room, `${player.name} melewati Bundaran Senayan (+${formatRp(PASS_START_BONUS)}).`);
  }

  player.position = steps[steps.length - 1];
  room.state.lastMove = {
    sequenceId: makeId('mv'),
    playerId: player.id,
    steps,
    passedStart,
  };

  resolveLanding(room, player, sum);
}

function tryBuildHouse(room: InternalRoom, player: Player, tileIndex: number): boolean {
  const tile = JAKSEL_TILES[tileIndex];
  const prop = room.state.properties[tileIndex];
  if (!tile || !prop || tile.category !== 'PROPERTY' || !tile.district || !tile.houseCost) {
    return false;
  }
  if (prop.ownerId !== player.id || prop.mortgaged || prop.houses >= 5) return false;
  const group = getDistrictTiles(tile.district);
  const ownsSet = group.every(
    (t) => room.state.properties[t.index]?.ownerId === player.id && !room.state.properties[t.index]?.mortgaged
  );
  if (!ownsSet) return false;
  if (player.cash < tile.houseCost) return false;

  player.cash -= tile.houseCost;
  prop.houses += 1;
  const label = prop.houses === 5 ? 'Hotel' : `Rumah #${prop.houses}`;
  room.state.actionBanner = `${player.name} membangun ${label} di ${tile.name}!`;
  pushSystemChat(room, `${player.name} membangun ${label} di ${tile.name} (${formatRp(tile.houseCost)}).`);
  return true;
}

function scheduleBotIfNeeded(room: InternalRoom): void {
  clearBotTimer(room);
  if (room.state.phase === 'LOBBY' || room.state.phase === 'GAME_OVER') return;
  const current = getCurrentPlayer(room);
  if (!current || !current.isBot || current.bankrupt) return;

  room.botTimer = setTimeout(() => {
    const active = getCurrentPlayer(room);
    if (!active || !active.isBot || room.state.phase === 'GAME_OVER') return;

    if (room.state.phase === 'ROLL') {
      if (active.inJail && active.jailFreeCards > 0) {
        active.jailFreeCards -= 1;
        active.inJail = false;
        active.jailTurns = 0;
        pushSystemChat(room, `${active.name} menggunakan Kartu Bebas Tilang ETLE.`);
      } else if (active.inJail && active.cash >= JAIL_FINE + 150) {
        active.cash -= JAIL_FINE;
        active.inJail = false;
        active.jailTurns = 0;
        pushSystemChat(room, `${active.name} membayar denda ${formatRp(JAIL_FINE)} agar bebas macet.`);
      }
      performRollDice(room, active);
      broadcastState(room);
      scheduleBotIfNeeded(room);
      return;
    }

    if (room.state.phase === 'BUY_DECISION') {
      const tile = JAKSEL_TILES[active.position];
      const prop = room.state.properties[tile.index];
      const price = tile.price ?? 0;
      if (prop && !prop.ownerId && active.cash >= price + 60) {
        active.cash -= price;
        prop.ownerId = active.id;
        room.state.actionBanner = `${active.name} membeli ${tile.name} (${formatRp(price)}).`;
        pushSystemChat(room, `${active.name} membeli ${tile.name} seharga ${formatRp(price)}.`);
      } else {
        room.state.actionBanner = `${active.name} memilih melewatkan ${tile.name}.`;
      }
      room.state.phase = 'END_TURN';
      broadcastState(room);
      scheduleBotIfNeeded(room);
      return;
    }

    if (room.state.phase === 'END_TURN') {
      // Bot opportunistically builds a house if it owns a complete district and has healthy cash
      for (const tile of JAKSEL_TILES) {
        if (tile.category === 'PROPERTY' && tile.houseCost && active.cash >= tile.houseCost + 220) {
          if (tryBuildHouse(room, active, tile.index)) {
            break;
          }
        }
      }
      advanceTurn(room);
      broadcastState(room);
    }
  }, 1050);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, rooms: rooms.size });
  });

  app.get('/api/rooms', (_req, res) => {
    const list: PublicRoomSummary[] = [];
    for (const room of rooms.values()) {
      if (room.clients.size > 0 || room.state.phase !== 'LOBBY') {
        const host = room.state.players.find((p) => p.id === room.state.hostId);
        list.push({
          roomId: room.state.roomId,
          playerCount: room.state.players.length,
          maxPlayers: 4,
          phase: room.state.phase,
          hostName: host?.name ?? 'Host',
        });
      }
    }
    res.json({ rooms: list });
  });

  wss.on('connection', (ws) => {
    const meta: ClientMeta = {
      ws,
      roomId: null,
      playerId: null,
      clientId: null,
    };

    ws.on('message', (raw) => {
      let msg: ClientToServerEvent;
      try {
        msg = JSON.parse(raw.toString()) as ClientToServerEvent;
      } catch {
        return;
      }

      if (msg.type === 'room:join') {
        const cleanRoomId =
          msg.payload.roomId
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9-]/g, '')
            .slice(0, 14) || 'JAKSEL';
        const cleanName = msg.payload.playerName.trim().slice(0, 20) || 'Pemain Jaksel';
        const clientId = msg.payload.clientId || makeId('cli');

        meta.clientId = clientId;
        meta.roomId = cleanRoomId;

        let room = rooms.get(cleanRoomId);
        if (!room) {
          const tokenCfg = getTokenConfig(msg.payload.token);
          const hostPlayer: Player = {
            id: makeId('plr'),
            clientId,
            name: cleanName,
            token: tokenCfg.id,
            color: tokenCfg.color,
            isBot: false,
            connected: true,
            cash: STARTING_CASH,
            position: 0,
            inJail: false,
            jailTurns: 0,
            jailFreeCards: 0,
            bankrupt: false,
            consecutiveDoubles: 0,
          };
          room = createRoom(cleanRoomId, hostPlayer);
          meta.playerId = hostPlayer.id;
          room.clients.add(meta);
          pushSystemChat(room, `${hostPlayer.name} membuka meja Monopoli Jaksel (${cleanRoomId}).`);
          broadcastState(room);
          return;
        }

        room.clients.add(meta);

        // Reconnect check
        const existing = room.state.players.find((p) => p.clientId === clientId && !p.isBot);
        if (existing) {
          existing.connected = true;
          existing.name = cleanName;
          meta.playerId = existing.id;
          pushSystemChat(room, `${existing.name} terhubung kembali ke meja.`);
          broadcastState(room);
          return;
        }

        if (room.state.phase === 'LOBBY' && room.state.players.length < 4) {
          const chosenToken = pickAvailableToken(room.state.players, msg.payload.token);
          const tokenCfg = getTokenConfig(chosenToken);
          const newPlayer: Player = {
            id: makeId('plr'),
            clientId,
            name: cleanName,
            token: chosenToken,
            color: tokenCfg.color,
            isBot: false,
            connected: true,
            cash: STARTING_CASH,
            position: 0,
            inJail: false,
            jailTurns: 0,
            jailFreeCards: 0,
            bankrupt: false,
            consecutiveDoubles: 0,
          };
          room.state.players.push(newPlayer);
          meta.playerId = newPlayer.id;
          pushSystemChat(room, `${newPlayer.name} bergabung ke meja dengan pion ${tokenCfg.name}.`);
          broadcastState(room);
          return;
        }

        // Spectator mode if room is full or already playing
        meta.playerId = null;
        sendToClient(ws, {
          type: 'room:state',
          payload: { state: room.state, yourPlayerId: null },
        });
        return;
      }

      if (!meta.roomId) return;
      const room = rooms.get(meta.roomId);
      if (!room) return;

      if (msg.type === 'chat:send') {
        const text = msg.payload.text.trim().slice(0, 240);
        if (!text) return;
        const sender = room.state.players.find((p) => p.id === meta.playerId);
        const chatMsg: ChatMessage = {
          id: makeId('msg'),
          senderId: sender?.id ?? meta.clientId ?? 'spectator',
          senderName: sender?.name ?? 'Penonton',
          senderColor: sender?.color ?? '#94A3B8',
          senderToken: sender?.token,
          text,
          timestamp: Date.now(),
          type: 'user',
        };
        room.state.chat = [...room.state.chat.slice(-79), chatMsg];
        for (const client of room.clients) {
          sendToClient(client.ws, { type: 'chat:message', payload: chatMsg });
        }
        return;
      }

      const senderPlayer = room.state.players.find((p) => p.id === meta.playerId);
      if (!senderPlayer) return;

      if (msg.type === 'room:add_bot') {
        if (room.state.phase !== 'LOBBY' || senderPlayer.id !== room.state.hostId) return;
        if (room.state.players.length >= 4) return;
        const tokenId = pickAvailableToken(room.state.players);
        const tokenCfg = getTokenConfig(tokenId);
        const usedNames = new Set(room.state.players.map((p) => p.name));
        const botName =
          BOT_NAMES.find((n) => !usedNames.has(n)) ?? `Bot ${room.state.players.length + 1}`;
        const bot: Player = {
          id: makeId('bot'),
          clientId: makeId('botcli'),
          name: botName,
          token: tokenId,
          color: tokenCfg.color,
          isBot: true,
          connected: true,
          cash: STARTING_CASH,
          position: 0,
          inJail: false,
          jailTurns: 0,
          jailFreeCards: 0,
          bankrupt: false,
          consecutiveDoubles: 0,
        };
        room.state.players.push(bot);
        pushSystemChat(room, `${bot.name} (${tokenCfg.name}) ditambahkan ke meja.`);
        broadcastState(room);
        return;
      }

      if (msg.type === 'room:remove_bot') {
        if (room.state.phase !== 'LOBBY' || senderPlayer.id !== room.state.hostId) return;
        room.state.players = room.state.players.filter(
          (p) => !(p.id === msg.payload.botId && p.isBot)
        );
        broadcastState(room);
        return;
      }

      if (msg.type === 'room:start') {
        if (room.state.phase !== 'LOBBY' || senderPlayer.id !== room.state.hostId) return;
        if (room.state.players.length < 2) {
          sendToClient(ws, {
            type: 'room:error',
            payload: { message: 'Minimal 2 pemain (atau tambah 1 Bot) untuk memulai.' },
          });
          return;
        }
        room.state.phase = 'ROLL';
        room.state.currentTurnIndex = 0;
        room.state.turnCount = 1;
        const first = room.state.players[0];
        room.state.actionBanner = `Permainan dimulai! Giliran ${first.name} melempar dadu.`;
        pushSystemChat(room, `Permainan Monopoli Jaksel dimulai! Giliran pertama: ${first.name}.`);
        broadcastState(room);
        scheduleBotIfNeeded(room);
        return;
      }

      if (msg.type === 'room:reset') {
        if (senderPlayer.id !== room.state.hostId && room.state.phase !== 'GAME_OVER') return;
        clearBotTimer(room);
        room.state.phase = 'LOBBY';
        room.state.properties = createInitialProperties();
        room.state.currentTurnIndex = 0;
        room.state.turnCount = 1;
        room.state.lastRoll = null;
        room.state.lastRollWasDouble = false;
        room.state.freeParkingPot = 100;
        room.state.winnerId = null;
        room.state.lastMove = null;
        room.state.lastCard = null;
        room.state.actionBanner = 'Meja direset. Siap untuk ronde baru!';
        for (const p of room.state.players) {
          p.cash = STARTING_CASH;
          p.position = 0;
          p.inJail = false;
          p.jailTurns = 0;
          p.jailFreeCards = 0;
          p.bankrupt = false;
          p.consecutiveDoubles = 0;
        }
        pushSystemChat(room, 'Meja direset untuk permainan baru.');
        broadcastState(room);
        return;
      }

      // Turn-restricted game actions
      const current = getCurrentPlayer(room);
      if (!current || current.id !== senderPlayer.id) return;

      if (msg.type === 'game:roll_dice') {
        if (room.state.phase !== 'ROLL') return;
        performRollDice(room, senderPlayer);
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:buy_property') {
        if (room.state.phase !== 'BUY_DECISION') return;
        const tile = JAKSEL_TILES[senderPlayer.position];
        const prop = room.state.properties[tile.index];
        const price = tile.price ?? 0;
        if (!prop || prop.ownerId || senderPlayer.cash < price) return;
        senderPlayer.cash -= price;
        prop.ownerId = senderPlayer.id;
        room.state.actionBanner = `${senderPlayer.name} resmi memiliki ${tile.name}!`;
        pushSystemChat(room, `${senderPlayer.name} membeli ${tile.name} seharga ${formatRp(price)}.`);
        room.state.phase = 'END_TURN';
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:skip_buy') {
        if (room.state.phase !== 'BUY_DECISION') return;
        const tile = JAKSEL_TILES[senderPlayer.position];
        room.state.actionBanner = `${senderPlayer.name} melewati pembelian ${tile.name}.`;
        room.state.phase = 'END_TURN';
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:build_house') {
        if (room.state.phase !== 'END_TURN' && room.state.phase !== 'ROLL') return;
        if (tryBuildHouse(room, senderPlayer, msg.payload.tileIndex)) {
          broadcastState(room);
        }
        return;
      }

      if (msg.type === 'game:sell_house') {
        const tile = JAKSEL_TILES[msg.payload.tileIndex];
        const prop = room.state.properties[msg.payload.tileIndex];
        if (!tile || !prop || prop.ownerId !== senderPlayer.id || prop.houses <= 0 || !tile.houseCost) {
          return;
        }
        prop.houses -= 1;
        const refund = Math.floor(tile.houseCost * 0.5);
        senderPlayer.cash += refund;
        room.state.actionBanner = `${senderPlayer.name} menjual bangunan di ${tile.name} (+${formatRp(refund)}).`;
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:toggle_mortgage') {
        const tile = JAKSEL_TILES[msg.payload.tileIndex];
        const prop = room.state.properties[msg.payload.tileIndex];
        if (!tile || !prop || prop.ownerId !== senderPlayer.id || !tile.price) return;
        if (!prop.mortgaged && prop.houses === 0) {
          prop.mortgaged = true;
          const loan = Math.floor(tile.price * 0.5);
          senderPlayer.cash += loan;
          room.state.actionBanner = `${senderPlayer.name} menggadaikan ${tile.name} (+${formatRp(loan)}).`;
          broadcastState(room);
        } else if (prop.mortgaged) {
          const redeem = Math.ceil(tile.price * 0.55);
          if (senderPlayer.cash >= redeem) {
            prop.mortgaged = false;
            senderPlayer.cash -= redeem;
            room.state.actionBanner = `${senderPlayer.name} menebus gadai ${tile.name} (-${formatRp(redeem)}).`;
            broadcastState(room);
          }
        }
        return;
      }

      if (msg.type === 'game:pay_jail_fine') {
        if (room.state.phase !== 'ROLL' || !senderPlayer.inJail) return;
        if (senderPlayer.cash < JAIL_FINE) return;
        senderPlayer.cash -= JAIL_FINE;
        senderPlayer.inJail = false;
        senderPlayer.jailTurns = 0;
        room.state.actionBanner = `${senderPlayer.name} membayar denda macet ${formatRp(JAIL_FINE)}. Silakan lempar dadu!`;
        pushSystemChat(room, `${senderPlayer.name} membayar denda ${formatRp(JAIL_FINE)} dan bebas dari Penjara.`);
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:use_jail_card') {
        if (room.state.phase !== 'ROLL' || !senderPlayer.inJail || senderPlayer.jailFreeCards <= 0) {
          return;
        }
        senderPlayer.jailFreeCards -= 1;
        senderPlayer.inJail = false;
        senderPlayer.jailTurns = 0;
        room.state.actionBanner = `${senderPlayer.name} memakai Kartu Bebas Tilang ETLE! Silakan lempar dadu.`;
        pushSystemChat(room, `${senderPlayer.name} memakai Kartu Bebas Tilang ETLE.`);
        broadcastState(room);
        return;
      }

      if (msg.type === 'game:end_turn') {
        if (room.state.phase !== 'END_TURN') return;
        advanceTurn(room);
        broadcastState(room);
      }
    });

    ws.on('close', () => {
      if (!meta.roomId) return;
      const room = rooms.get(meta.roomId);
      if (!room) return;
      room.clients.delete(meta);
      if (meta.playerId) {
        const player = room.state.players.find((p) => p.id === meta.playerId);
        if (player) {
          player.connected = false;
          pushSystemChat(room, `${player.name} terputus sementara dari meja.`);
        }
      }
      broadcastState(room);
      // Clean up completely abandoned lobby rooms after 2 minutes
      if (room.clients.size === 0) {
        setTimeout(() => {
          const check = rooms.get(meta.roomId!);
          if (check && check.clients.size === 0) {
            clearBotTimer(check);
            rooms.delete(meta.roomId!);
          }
        }, 120_000);
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Monopoli Jaksel server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { calculateNetWorth };
