import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  HelpCircle,
  LogOut,
  MessageSquare,
  RotateCcw,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ChatMessage,
  ClientToServerEvent,
  DrawnCardEvent,
  RoomState,
  ServerToClientEvent,
  TokenId,
} from './shared/jakselBoard';
import { soundEngine } from './utils/sound';
import { TitleScreen } from './components/TitleScreen';
import { MonopolyBoard3D } from './components/MonopolyBoard3D';
import { PlayerRoster } from './components/PlayerRoster';
import { ChatAndLogPanel } from './components/ChatAndLogPanel';
import {
  DrawnCardToast,
  GameOverModal,
  PropertyInspectorModal,
  RulesModal,
} from './components/BoardModals';

function getSessionClientId(): string {
  const key = 'jaksel_monopoly_client_id';
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = `cli-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
    sessionStorage.setItem(key, id);
  }
  return id;
}

export default function App() {
  const initialRoomParam =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room') ?? ''
      : '';

  const [sessionConfig, setSessionConfig] = useState<{
    playerName: string;
    roomId: string;
    token: TokenId;
  } | null>(null);

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [yourPlayerId, setYourPlayerId] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [dismissedCardId, setDismissedCardId] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'none' | 'players' | 'chat'>('none');
  const [unreadChat, setUnreadChat] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastVictoryIdRef = useRef<string | null>(null);
  const lastCardSoundRef = useRef<string | null>(null);

  const sendEvent = useCallback((event: ClientToServerEvent) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }, []);

  useEffect(() => {
    if (!sessionConfig) return;

    let unmounted = false;
    const clientId = getSessionClientId();

    const connect = () => {
      if (unmounted) return;
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) return;
        setWsConnected(true);
        const joinEvent: ClientToServerEvent = {
          type: 'room:join',
          payload: {
            roomId: sessionConfig.roomId,
            playerName: sessionConfig.playerName,
            token: sessionConfig.token,
            clientId,
          },
        };
        ws.send(JSON.stringify(joinEvent));
      };

      ws.onmessage = (evt) => {
        if (unmounted) return;
        let parsed: ServerToClientEvent;
        try {
          parsed = JSON.parse(evt.data as string) as ServerToClientEvent;
        } catch {
          return;
        }

        if (parsed.type === 'room:state') {
          setRoomState(parsed.payload.state);
          setYourPlayerId(parsed.payload.yourPlayerId);
        } else if (parsed.type === 'chat:message') {
          const newMsg: ChatMessage = parsed.payload;
          setRoomState((prev) => {
            if (!prev) return prev;
            if (prev.chat.some((c) => c.id === newMsg.id)) return prev;
            return {
              ...prev,
              chat: [...prev.chat.slice(-79), newMsg],
            };
          });
          if (newMsg.type === 'user' && newMsg.senderId !== yourPlayerId) {
            soundEngine.playChatPing();
            setUnreadChat((c) => c + 1);
          }
        } else if (parsed.type === 'room:error') {
          setErrorToast(parsed.payload.message);
          setTimeout(() => setErrorToast(null), 3200);
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setWsConnected(false);
        reconnectTimerRef.current = setTimeout(connect, 1800);
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [sessionConfig]);

  // Sound triggers for card draw & victory
  useEffect(() => {
    if (!roomState) return;
    if (
      roomState.lastCard &&
      roomState.lastCard.id !== lastCardSoundRef.current
    ) {
      lastCardSoundRef.current = roomState.lastCard.id;
      soundEngine.playCardDraw();
    }
    if (
      roomState.phase === 'GAME_OVER' &&
      roomState.winnerId &&
      lastVictoryIdRef.current !== `${roomState.roomId}-${roomState.turnCount}`
    ) {
      lastVictoryIdRef.current = `${roomState.roomId}-${roomState.turnCount}`;
      soundEngine.playVictoryFanfare();
    }
  }, [roomState]);

  // Keyboard shortcuts (Space for quick Roll / End Turn, Esc closes modals)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTile(null);
        setRulesOpen(false);
        setMobilePanel('none');
        return;
      }
      if (!roomState || !yourPlayerId) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space') {
        const current = roomState.players[roomState.currentTurnIndex];
        if (!current || current.id !== yourPlayerId) return;
        if (roomState.phase === 'ROLL') {
          e.preventDefault();
          sendEvent({ type: 'game:roll_dice' });
        } else if (roomState.phase === 'END_TURN') {
          e.preventDefault();
          sendEvent({ type: 'game:end_turn' });
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [roomState, yourPlayerId, sendEvent]);

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    soundEngine.setMuted(next);
  };

  const handleLeaveRoom = () => {
    wsRef.current?.close();
    setSessionConfig(null);
    setRoomState(null);
    setYourPlayerId(null);
    setSelectedTile(null);
  };

  if (!sessionConfig) {
    return (
      <TitleScreen
        initialRoomCode={initialRoomParam}
        onJoinRoom={(playerName, roomId, token) => {
          setSessionConfig({ playerName, roomId, token });
        }}
      />
    );
  }

  if (!roomState) {
    return (
      <div className="h-screen w-screen bg-[#08241D] text-[#F6F2E9] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5A93C] border-t-transparent animate-spin" />
        <p className="text-sm text-[#F6F2E9]/75">
          Menghubungkan ke meja {sessionConfig.roomId}...
        </p>
      </div>
    );
  }

  const activeCard: DrawnCardEvent | null =
    roomState.lastCard && roomState.lastCard.id !== dismissedCardId
      ? roomState.lastCard
      : null;

  const isHost = yourPlayerId === roomState.hostId;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[radial-gradient(circle_at_center,#113A2F_0%,#071F19_75%,#051712_100%)] text-[#F6F2E9] flex flex-col">
      {/* Compact Perimeter HUD Strip */}
      <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 pt-3 pb-1 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#F6F2E9] whitespace-nowrap">
            MONOPOLI JAKSEL
          </span>
          <span className="text-[#F6F2E9]/30 hidden sm:inline" aria-hidden="true">
            ·
          </span>
          <span className="hidden sm:inline text-xs text-[#F6F2E9]/65 truncate">
            {yourPlayerId ? 'Papan 3D Jakarta Selatan' : 'Mode Penonton · Chat Aktif'}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Panel Toggles */}
          <button
            type="button"
            onClick={() =>
              setMobilePanel((p) => (p === 'players' ? 'none' : 'players'))
            }
            className="lg:hidden inline-flex items-center gap-1.5 rounded-lg bg-[#0F3128] border border-[#F6F2E9]/15 px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            <Users className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Pemain</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setUnreadChat(0);
              setMobilePanel((p) => (p === 'chat' ? 'none' : 'chat'));
            }}
            className="lg:hidden relative inline-flex items-center gap-1.5 rounded-lg bg-[#0F3128] border border-[#F6F2E9]/15 px-2.5 py-1.5 text-xs font-medium cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Chat</span>
            {unreadChat > 0 && (
              <span className="ml-0.5 font-mono text-[10px] text-[#E5A93C] font-bold">
                ({unreadChat})
              </span>
            )}
          </button>

          {isHost && roomState.phase !== 'LOBBY' && (
            <button
              type="button"
              onClick={() => sendEvent({ type: 'room:reset' })}
              title="Reset meja ke lobi"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F3128] hover:bg-[#174237] border border-[#F6F2E9]/12 px-2.5 py-1.5 text-xs font-medium text-[#F6F2E9]/85 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRulesOpen(true)}
            title="Panduan bermain"
            aria-label="Panduan bermain"
            className="p-2 rounded-lg bg-[#0F3128] hover:bg-[#174237] border border-[#F6F2E9]/12 text-[#F6F2E9]/85 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={toggleMute}
            title={muted ? 'Nyalakan suara' : 'Bisukan suara'}
            aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
            className="p-2 rounded-lg bg-[#0F3128] hover:bg-[#174237] border border-[#F6F2E9]/12 text-[#F6F2E9]/85 transition-colors cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#E5A93C]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleLeaveRoom}
            title="Keluar meja"
            aria-label="Keluar meja"
            className="p-2 rounded-lg bg-[#0F3128] hover:bg-rose-900/50 border border-[#F6F2E9]/12 text-[#F6F2E9]/85 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main 3-Zone Arena */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[290px_1fr_320px] xl:grid-cols-[310px_1fr_340px] gap-4 px-4 sm:px-6 pb-4 pt-2">
        {/* Left Rail: Player Roster (Desktop) */}
        <div className="hidden lg:block min-h-0">
          <PlayerRoster
            state={roomState}
            yourPlayerId={yourPlayerId}
            onAddBot={() => sendEvent({ type: 'room:add_bot' })}
            onRemoveBot={(botId) =>
              sendEvent({ type: 'room:remove_bot', payload: { botId } })
            }
            onSelectTile={(idx) => setSelectedTile(idx)}
          />
        </div>

        {/* Center Hero: 3D Classic South Jakarta Monopoly Board */}
        <div className="min-h-0 flex items-center justify-center">
          <MonopolyBoard3D
            state={roomState}
            yourPlayerId={yourPlayerId}
            selectedTileIndex={selectedTile}
            onSelectTile={(idx) => setSelectedTile(idx)}
            onRollDice={() => sendEvent({ type: 'game:roll_dice' })}
            onBuyProperty={() => sendEvent({ type: 'game:buy_property' })}
            onSkipBuy={() => sendEvent({ type: 'game:skip_buy' })}
            onEndTurn={() => sendEvent({ type: 'game:end_turn' })}
            onPayJailFine={() => sendEvent({ type: 'game:pay_jail_fine' })}
            onUseJailCard={() => sendEvent({ type: 'game:use_jail_card' })}
            onStartGame={() => sendEvent({ type: 'room:start' })}
          />
        </div>

        {/* Right Rail: Real-Time WebSocket Chat (Desktop) */}
        <div className="hidden lg:block min-h-0">
          <ChatAndLogPanel
            messages={roomState.chat}
            connected={wsConnected}
            yourPlayerId={yourPlayerId}
            onSendMessage={(text) =>
              sendEvent({ type: 'chat:send', payload: { text } })
            }
          />
        </div>
      </main>

      {/* Mobile Drawer Overlay */}
      {mobilePanel !== 'none' && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden flex justify-end"
          onClick={() => setMobilePanel('none')}
        >
          <div
            className="w-[min(90vw,360px)] h-full p-3 bg-[#08241D]"
            onClick={(e) => e.stopPropagation()}
          >
            {mobilePanel === 'players' ? (
              <PlayerRoster
                state={roomState}
                yourPlayerId={yourPlayerId}
                onAddBot={() => sendEvent({ type: 'room:add_bot' })}
                onRemoveBot={(botId) =>
                  sendEvent({ type: 'room:remove_bot', payload: { botId } })
                }
                onSelectTile={(idx) => {
                  setMobilePanel('none');
                  setSelectedTile(idx);
                }}
              />
            ) : (
              <ChatAndLogPanel
                messages={roomState.chat}
                connected={wsConnected}
                yourPlayerId={yourPlayerId}
                onSendMessage={(text) =>
                  sendEvent({ type: 'chat:send', payload: { text } })
                }
              />
            )}
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-rose-900 border border-rose-400/50 px-4 py-2 text-xs font-semibold text-white shadow-xl">
          {errorToast}
        </div>
      )}

      {/* Drawn Card Toast */}
      <DrawnCardToast
        cardEvent={activeCard}
        onDismiss={() => {
          if (activeCard) setDismissedCardId(activeCard.id);
        }}
      />

      {/* Property Deed Inspector & Build Modal */}
      <PropertyInspectorModal
        tileIndex={selectedTile}
        state={roomState}
        yourPlayerId={yourPlayerId}
        onClose={() => setSelectedTile(null)}
        onBuildHouse={(tileIndex) =>
          sendEvent({ type: 'game:build_house', payload: { tileIndex } })
        }
        onSellHouse={(tileIndex) =>
          sendEvent({ type: 'game:sell_house', payload: { tileIndex } })
        }
        onToggleMortgage={(tileIndex) =>
          sendEvent({ type: 'game:toggle_mortgage', payload: { tileIndex } })
        }
      />

      {/* Rules Modal */}
      <RulesModal open={rulesOpen} onClose={() => setRulesOpen(false)} />

      {/* Victory / Game Over Modal */}
      <GameOverModal
        state={roomState}
        onPlayAgain={() => sendEvent({ type: 'room:reset' })}
      />
    </div>
  );
}
