export type TileCategory =
  | 'START'
  | 'PROPERTY'
  | 'TRANSIT'
  | 'UTILITY'
  | 'CHANCE'
  | 'CHEST'
  | 'TAX'
  | 'JAIL'
  | 'PARKING'
  | 'GOTO_JAIL';

export type DistrictColor =
  | 'brown'
  | 'sky'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'royal'
  | 'transit'
  | 'utility';

export type TokenId = 'bajaj' | 'vespa' | 'mrt' | 'kopi';

export interface TokenConfig {
  id: TokenId;
  name: string;
  subtitle: string;
  color: string;
  accent: string;
}

export const PLAYER_TOKENS: TokenConfig[] = [
  {
    id: 'bajaj',
    name: 'Bajaj Merah',
    subtitle: 'Lincah di gang Kemang',
    color: '#E05A47',
    accent: '#FCA5A5',
  },
  {
    id: 'vespa',
    name: 'Vespa Senopati',
    subtitle: 'Santai sore di Santa',
    color: '#E5A93C',
    accent: '#FDE68A',
  },
  {
    id: 'mrt',
    name: 'MRT Ratangga',
    subtitle: 'Cepat bebas macet',
    color: '#14B8A6',
    accent: '#99F6E4',
  },
  {
    id: 'kopi',
    name: 'Kopi Cipete',
    subtitle: 'Energi lembur SCBD',
    color: '#A855F7',
    accent: '#E9D5FF',
  },
];

export const DISTRICT_PALETTE: Record<
  DistrictColor,
  { hex: string; label: string; textOnBand: string }
> = {
  brown: { hex: '#8B5A3C', label: 'Selatan Lama', textOnBand: '#FFFFFF' },
  sky: { hex: '#38BDF8', label: 'Tebet & Pancoran', textOnBand: '#082F49' },
  pink: { hex: '#EC4899', label: 'Cipete & Kemang', textOnBand: '#FFFFFF' },
  orange: { hex: '#F97316', label: 'Kebayoran Baru', textOnBand: '#FFFFFF' },
  red: { hex: '#EF4444', label: 'Koridor Antasari', textOnBand: '#FFFFFF' },
  yellow: { hex: '#EAB308', label: 'Kuningan & PI', textOnBand: '#1C1917' },
  green: { hex: '#10B981', label: 'Zona Senopati', textOnBand: '#FFFFFF' },
  royal: { hex: '#2563EB', label: 'Kawasan SCBD', textOnBand: '#FFFFFF' },
  transit: { hex: '#334155', label: 'Transportasi', textOnBand: '#F8FAFC' },
  utility: { hex: '#0F766E', label: 'Utilitas Publik', textOnBand: '#F0FDFA' },
};

export interface BoardTile {
  index: number;
  name: string;
  shortName: string;
  sublabel: string;
  category: TileCategory;
  district?: DistrictColor;
  price?: number;
  rent?: number[]; // [base, 1 house, 2 houses, 3 houses, hotel]
  houseCost?: number;
  taxAmount?: number;
}

export const STARTING_CASH = 1500; // Dalam Juta Rupiah (Rp 1.500 Jt)
export const PASS_START_BONUS = 200; // Rp 200 Jt
export const JAIL_TILE_INDEX = 7;
export const JAIL_FINE = 50; // Rp 50 Jt
export const TOTAL_TILES = 28;

export const JAKSEL_TILES: BoardTile[] = [
  {
    index: 0,
    name: 'Bundaran Senayan',
    shortName: 'MULAI',
    sublabel: 'Terima Rp 200 Jt',
    category: 'START',
  },
  {
    index: 1,
    name: 'Pasar Minggu',
    shortName: 'Ps. Minggu',
    sublabel: 'Jakarta Selatan',
    category: 'PROPERTY',
    district: 'brown',
    price: 60,
    rent: [6, 30, 90, 240, 400],
    houseCost: 50,
  },
  {
    index: 2,
    name: 'Dana Komunitas',
    shortName: 'Dana Jaksel',
    sublabel: 'Ambil Kartu',
    category: 'CHEST',
  },
  {
    index: 3,
    name: 'Jagakarsa',
    shortName: 'Jagakarsa',
    sublabel: 'Asri & Hijau',
    category: 'PROPERTY',
    district: 'brown',
    price: 80,
    rent: [8, 38, 110, 280, 460],
    houseCost: 50,
  },
  {
    index: 4,
    name: 'MRT Lebak Bulus',
    shortName: 'MRT Lb. Bulus',
    sublabel: 'Stasiun Awal',
    category: 'TRANSIT',
    district: 'transit',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  {
    index: 5,
    name: 'Tebet Eco Park',
    shortName: 'Tebet Park',
    sublabel: 'Taman Kota',
    category: 'PROPERTY',
    district: 'sky',
    price: 100,
    rent: [10, 50, 140, 350, 520],
    houseCost: 50,
  },
  {
    index: 6,
    name: 'Pancoran',
    shortName: 'Pancoran',
    sublabel: 'Tugu Dirgantara',
    category: 'PROPERTY',
    district: 'sky',
    price: 120,
    rent: [12, 60, 165, 400, 580],
    houseCost: 50,
  },
  {
    index: 7,
    name: 'Macet Rasuna Said',
    shortName: 'PENJARA',
    sublabel: 'Lewat / Terjebak',
    category: 'JAIL',
  },
  {
    index: 8,
    name: 'Cipete Raya',
    shortName: 'Cipete',
    sublabel: 'Kopi & Kuliner',
    category: 'PROPERTY',
    district: 'pink',
    price: 140,
    rent: [14, 70, 195, 460, 680],
    houseCost: 100,
  },
  {
    index: 9,
    name: 'PLN Distribusi Jaksel',
    shortName: 'PLN Jaksel',
    sublabel: 'Utilitas Listrik',
    category: 'UTILITY',
    district: 'utility',
    price: 150,
  },
  {
    index: 10,
    name: 'Kemang Raya',
    shortName: 'Kemang',
    sublabel: 'Distrik Kreatif',
    category: 'PROPERTY',
    district: 'pink',
    price: 160,
    rent: [16, 80, 220, 520, 760],
    houseCost: 100,
  },
  {
    index: 11,
    name: 'Halte CSW ASEAN',
    shortName: 'Halte CSW',
    sublabel: 'Simpang Transit',
    category: 'TRANSIT',
    district: 'transit',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  {
    index: 12,
    name: 'Dharmawangsa',
    shortName: 'Dharmawangsa',
    sublabel: 'Hunian Elit',
    category: 'PROPERTY',
    district: 'orange',
    price: 180,
    rent: [18, 90, 250, 580, 840],
    houseCost: 100,
  },
  {
    index: 13,
    name: 'Blok M Square',
    shortName: 'Blok M',
    sublabel: 'Little Tokyo',
    category: 'PROPERTY',
    district: 'orange',
    price: 200,
    rent: [20, 100, 280, 640, 920],
    houseCost: 100,
  },
  {
    index: 14,
    name: 'Taman Literasi',
    shortName: 'PARKIR GRATIS',
    sublabel: 'Ambil Dana Pajak',
    category: 'PARKING',
  },
  {
    index: 15,
    name: 'Radio Dalam',
    shortName: 'Radio Dalam',
    sublabel: 'Sentra Gaya',
    category: 'PROPERTY',
    district: 'red',
    price: 220,
    rent: [22, 110, 310, 700, 980],
    houseCost: 150,
  },
  {
    index: 16,
    name: 'Kartu Kesempatan',
    shortName: 'Kesempatan',
    sublabel: 'Kejutan Jaksel',
    category: 'CHANCE',
  },
  {
    index: 17,
    name: 'Pangeran Antasari',
    shortName: 'Antasari',
    sublabel: 'Jalan Layang',
    category: 'PROPERTY',
    district: 'red',
    price: 240,
    rent: [24, 120, 340, 760, 1060],
    houseCost: 150,
  },
  {
    index: 18,
    name: 'Stasiun MRT Blok M',
    shortName: 'MRT Blok M',
    sublabel: 'Hub Utama',
    category: 'TRANSIT',
    district: 'transit',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  {
    index: 19,
    name: 'Mega Kuningan',
    shortName: 'Kuningan',
    sublabel: 'Menara Bisnis',
    category: 'PROPERTY',
    district: 'yellow',
    price: 260,
    rent: [26, 130, 370, 820, 1140],
    houseCost: 150,
  },
  {
    index: 20,
    name: 'Pondok Indah',
    shortName: 'Pondok Indah',
    sublabel: 'Kawasan Sultan',
    category: 'PROPERTY',
    district: 'yellow',
    price: 280,
    rent: [28, 145, 400, 890, 1220],
    houseCost: 150,
  },
  {
    index: 21,
    name: 'Kena Tilang ETLE',
    shortName: 'MASUK PENJARA',
    sublabel: 'Menuju Rasuna Said',
    category: 'GOTO_JAIL',
  },
  {
    index: 22,
    name: 'Jalan Senopati',
    shortName: 'Senopati',
    sublabel: 'Fine Dining Hub',
    category: 'PROPERTY',
    district: 'green',
    price: 300,
    rent: [32, 160, 440, 960, 1320],
    houseCost: 200,
  },
  {
    index: 23,
    name: 'Gunawarman',
    shortName: 'Gunawarman',
    sublabel: 'Boutique District',
    category: 'PROPERTY',
    district: 'green',
    price: 320,
    rent: [35, 175, 480, 1040, 1400],
    houseCost: 200,
  },
  {
    index: 24,
    name: 'PAM Jaya Jaksel',
    shortName: 'PAM Jaya',
    sublabel: 'Utilitas Air',
    category: 'UTILITY',
    district: 'utility',
    price: 150,
  },
  {
    index: 25,
    name: 'Stasiun MRT Senayan',
    shortName: 'MRT Senayan',
    sublabel: 'Gerbang Utara',
    category: 'TRANSIT',
    district: 'transit',
    price: 200,
    rent: [25, 50, 100, 200],
  },
  {
    index: 26,
    name: 'Pajak Properti Mewah',
    shortName: 'Pajak Jaksel',
    sublabel: 'Bayar Rp 100 Jt',
    category: 'TAX',
    taxAmount: 100,
  },
  {
    index: 27,
    name: 'SCBD Sudirman',
    shortName: 'SCBD',
    sublabel: 'Pusat Finansial',
    category: 'PROPERTY',
    district: 'royal',
    price: 400,
    rent: [50, 220, 620, 1300, 1800],
    houseCost: 200,
  },
];

export interface JakselCard {
  id: string;
  deck: 'CHANCE' | 'CHEST';
  title: string;
  description: string;
  effect:
    | { type: 'CASH'; amount: number }
    | { type: 'MOVE_TO'; tileIndex: number; collectStart: boolean }
    | { type: 'MOVE_REL'; steps: number }
    | { type: 'JAIL' }
    | { type: 'JAIL_FREE' }
    | { type: 'COLLECT_FROM_ALL'; amount: number };
}

export const CHANCE_CARDS: JakselCard[] = [
  {
    id: 'ch-1',
    deck: 'CHANCE',
    title: 'Naik MRT Bebas Macet',
    description: 'Langsung meluncur ke Stasiun MRT Blok M. Terima Rp 200 Jt jika melewati Mulai.',
    effect: { type: 'MOVE_TO', tileIndex: 18, collectStart: true },
  },
  {
    id: 'ch-2',
    deck: 'CHANCE',
    title: 'Kafe Senopati Viral',
    description: 'Konten review kafe Anda masuk FYP! Terima keuntungan Rp 150 Jt.',
    effect: { type: 'CASH', amount: 150 },
  },
  {
    id: 'ch-3',
    deck: 'CHANCE',
    title: 'Terkena Ganjil-Genap',
    description: 'Salah jalur di Jl. Sudirman, harus memutar balik mundur 3 petak.',
    effect: { type: 'MOVE_REL', steps: -3 },
  },
  {
    id: 'ch-4',
    deck: 'CHANCE',
    title: 'Undangan Rapat SCBD',
    description: 'Melaju langsung menuju SCBD Sudirman. Lewati Mulai untuk klaim Rp 200 Jt.',
    effect: { type: 'MOVE_TO', tileIndex: 27, collectStart: true },
  },
  {
    id: 'ch-5',
    deck: 'CHANCE',
    title: 'Kartu Bebas Tilang ETLE',
    description: 'Simpan kartu ini untuk keluar gratis saat terjebak Macet Rasuna Said.',
    effect: { type: 'JAIL_FREE' },
  },
  {
    id: 'ch-6',
    deck: 'CHANCE',
    title: 'Hujan Deras di Kemang',
    description: 'Biaya darurat perawatan drainase ruko sebesar Rp 75 Jt.',
    effect: { type: 'CASH', amount: -75 },
  },
];

export const CHEST_CARDS: JakselCard[] = [
  {
    id: 'cs-1',
    deck: 'CHEST',
    title: 'Dividen Saham Blok M',
    description: 'Penyewa retail melunasi sewa tahunan. Terima Rp 120 Jt.',
    effect: { type: 'CASH', amount: 120 },
  },
  {
    id: 'cs-2',
    deck: 'CHEST',
    title: 'Patungan Kopi Jaksel',
    description: 'Semua pemain lain mentraktir proyek kolaborasi Anda masing-masing Rp 30 Jt.',
    effect: { type: 'COLLECT_FROM_ALL', amount: 30 },
  },
  {
    id: 'cs-3',
    deck: 'CHEST',
    title: 'Bonus Tahunan Perusahaan',
    description: 'Kinerja aset properti melampaui target! Terima Rp 180 Jt.',
    effect: { type: 'CASH', amount: 180 },
  },
  {
    id: 'cs-4',
    deck: 'CHEST',
    title: 'Renovasi Taman Kota',
    description: 'Iuran kontribusi lingkungan Tebet Eco Park sebesar Rp 60 Jt.',
    effect: { type: 'CASH', amount: -60 },
  },
  {
    id: 'cs-5',
    deck: 'CHEST',
    title: 'Balik ke Bundaran Senayan',
    description: 'Kembali ke petak Mulai dan klaim dana segar Rp 200 Jt.',
    effect: { type: 'MOVE_TO', tileIndex: 0, collectStart: true },
  },
  {
    id: 'cs-6',
    deck: 'CHEST',
    title: 'Audit Pajak Kendaraan',
    description: 'Pelunasan administrasi kendaraan operasional sebesar Rp 50 Jt.',
    effect: { type: 'CASH', amount: -50 },
  },
];

export interface Player {
  id: string;
  clientId: string;
  name: string;
  token: TokenId;
  color: string;
  isBot: boolean;
  connected: boolean;
  cash: number;
  position: number;
  inJail: boolean;
  jailTurns: number;
  jailFreeCards: number;
  bankrupt: boolean;
  consecutiveDoubles: number;
}

export interface PropertyState {
  ownerId: string | null;
  houses: number; // 0-4 houses, 5 = hotel
  mortgaged: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderToken?: TokenId;
  text: string;
  timestamp: number;
  type: 'user' | 'system';
}

export type TurnPhase =
  | 'LOBBY'
  | 'ROLL'
  | 'BUY_DECISION'
  | 'END_TURN'
  | 'GAME_OVER';

export interface ActiveMoveAnimation {
  sequenceId: string;
  playerId: string;
  steps: number[]; // tile indices to hop through in order
  passedStart: boolean;
}

export interface DrawnCardEvent {
  id: string;
  playerId: string;
  playerName: string;
  card: JakselCard;
}

export interface RoomState {
  roomId: string;
  hostId: string;
  phase: TurnPhase;
  players: Player[];
  properties: Record<number, PropertyState>;
  currentTurnIndex: number;
  turnCount: number;
  lastRoll: [number, number] | null;
  lastRollWasDouble: boolean;
  freeParkingPot: number;
  winnerId: string | null;
  chat: ChatMessage[];
  lastMove: ActiveMoveAnimation | null;
  lastCard: DrawnCardEvent | null;
  actionBanner: string;
}

export interface PublicRoomSummary {
  roomId: string;
  playerCount: number;
  maxPlayers: number;
  phase: TurnPhase;
  hostName: string;
}

// WebSocket Message Contracts
export type ClientToServerEvent =
  | {
      type: 'room:join';
      payload: {
        roomId: string;
        playerName: string;
        token: TokenId;
        clientId: string;
      };
    }
  | { type: 'room:add_bot' }
  | { type: 'room:remove_bot'; payload: { botId: string } }
  | { type: 'room:start' }
  | { type: 'room:reset' }
  | { type: 'game:roll_dice' }
  | { type: 'game:buy_property' }
  | { type: 'game:skip_buy' }
  | { type: 'game:build_house'; payload: { tileIndex: number } }
  | { type: 'game:sell_house'; payload: { tileIndex: number } }
  | { type: 'game:toggle_mortgage'; payload: { tileIndex: number } }
  | { type: 'game:pay_jail_fine' }
  | { type: 'game:use_jail_card' }
  | { type: 'game:end_turn' }
  | { type: 'chat:send'; payload: { text: string } };

export type ServerToClientEvent =
  | {
      type: 'room:state';
      payload: {
        state: RoomState;
        yourPlayerId: string | null;
      };
    }
  | {
      type: 'chat:message';
      payload: ChatMessage;
    }
  | {
      type: 'room:error';
      payload: { message: string };
    };

export function formatRp(millions: number): string {
  const abs = Math.abs(millions);
  const prefix = millions < 0 ? '-' : '';
  if (abs >= 1000) {
    const m = (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 2).replace(/\.?0+$/, '');
    return `${prefix}Rp ${m} M`;
  }
  return `${prefix}Rp ${abs} Jt`;
}

export function getDistrictTiles(district: DistrictColor): BoardTile[] {
  return JAKSEL_TILES.filter((t) => t.district === district && t.category === 'PROPERTY');
}

export function calculateRent(
  tile: BoardTile,
  propState: PropertyState,
  allProperties: Record<number, PropertyState>,
  lastDiceSum: number
): number {
  if (!propState.ownerId || propState.mortgaged) return 0;

  if (tile.category === 'TRANSIT') {
    const ownedTransits = JAKSEL_TILES.filter(
      (t) => t.category === 'TRANSIT' && allProperties[t.index]?.ownerId === propState.ownerId && !allProperties[t.index]?.mortgaged
    ).length;
    const rates = tile.rent ?? [25, 50, 100, 200];
    return rates[Math.max(0, Math.min(rates.length - 1, ownedTransits - 1))];
  }

  if (tile.category === 'UTILITY') {
    const ownedUtils = JAKSEL_TILES.filter(
      (t) => t.category === 'UTILITY' && allProperties[t.index]?.ownerId === propState.ownerId && !allProperties[t.index]?.mortgaged
    ).length;
    const multiplier = ownedUtils >= 2 ? 10 : 4;
    return Math.max(2, lastDiceSum) * multiplier;
  }

  if (tile.category === 'PROPERTY' && tile.rent && tile.district) {
    const houses = propState.houses;
    if (houses > 0) {
      return tile.rent[Math.min(houses, tile.rent.length - 1)];
    }
    const groupTiles = getDistrictTiles(tile.district);
    const ownsFullSet = groupTiles.every(
      (t) => allProperties[t.index]?.ownerId === propState.ownerId && !allProperties[t.index]?.mortgaged
    );
    return ownsFullSet ? tile.rent[0] * 2 : tile.rent[0];
  }

  return 0;
}

export function calculateNetWorth(
  player: Player,
  properties: Record<number, PropertyState>
): number {
  if (player.bankrupt) return 0;
  let total = player.cash;
  for (const tile of JAKSEL_TILES) {
    const prop = properties[tile.index];
    if (prop && prop.ownerId === player.id) {
      const baseValue = tile.price ?? 0;
      total += prop.mortgaged ? Math.floor(baseValue / 2) : baseValue;
      if (prop.houses > 0 && tile.houseCost) {
        total += prop.houses * Math.floor(tile.houseCost * 0.75);
      }
    }
  }
  return total;
}
