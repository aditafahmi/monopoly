import React, { useState } from 'react';
import { Bot, Check, Copy, Plus, Trash2, Building2 } from 'lucide-react';
import {
  DISTRICT_PALETTE,
  JAKSEL_TILES,
  RoomState,
  calculateNetWorth,
  formatRp,
} from '../shared/jakselBoard';
import { TokenIcon } from './TokenIcons';

interface PlayerRosterProps {
  state: RoomState;
  yourPlayerId: string | null;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onSelectTile: (tileIndex: number) => void;
}

export const PlayerRoster: React.FC<PlayerRosterProps> = ({
  state,
  yourPlayerId,
  onAddBot,
  onRemoveBot,
  onSelectTile,
}) => {
  const [copied, setCopied] = useState(false);
  const isHost = yourPlayerId === state.hostId;
  const currentPlayer = state.players[state.currentTurnIndex];

  const handleCopyInvite = () => {
    const url = `${window.location.origin}?room=${encodeURIComponent(state.roomId)}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <aside className="flex flex-col h-full bg-[#0C2921]/95 border border-[#F6F2E9]/10 rounded-2xl p-4 overflow-hidden">
      {/* Room Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F6F2E9]/10">
        <div className="min-w-0">
          <div className="text-[11px] font-medium text-[#F6F2E9]/55">
            Meja Permainan
          </div>
          <div className="font-mono text-sm font-bold text-[#E5A93C] truncate">
            {state.roomId}
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopyInvite}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#153D33] hover:bg-[#1C4D40] px-2.5 py-1.5 text-xs font-medium text-[#F6F2E9] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Salin tautan undangan meja"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Disalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[#E5A93C]" />
              <span>Undang</span>
            </>
          )}
        </button>
      </div>

      {/* Players List */}
      <div className="flex-1 overflow-y-auto jaksel-scroll py-3 space-y-2.5">
        {state.players.map((player) => {
          const isTurn =
            state.phase !== 'LOBBY' &&
            state.phase !== 'GAME_OVER' &&
            currentPlayer?.id === player.id;
          const isYou = player.id === yourPlayerId;
          const ownedTiles = JAKSEL_TILES.filter(
            (t) => state.properties[t.index]?.ownerId === player.id
          );
          const netWorth = calculateNetWorth(player, state.properties);

          return (
            <div
              key={player.id}
              className={`rounded-xl p-3 border transition-colors ${
                player.bankrupt
                  ? 'bg-[#081C17]/50 border-[#F6F2E9]/5 opacity-50'
                  : isTurn
                  ? 'bg-[#143D32] border-[#E5A93C]/70'
                  : 'bg-[#0A221B] border-[#F6F2E9]/10'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <TokenIcon token={player.token} size={32} className="shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[#F6F2E9] truncate">
                      <span className="truncate">{player.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#F6F2E9]/60">
                      {isYou && <span className="text-[#E5A93C] font-medium">Anda</span>}
                      {isYou && (player.isBot || player.inJail || player.bankrupt) && (
                        <span aria-hidden="true">·</span>
                      )}
                      {player.isBot && <span>Bot CPU</span>}
                      {!player.isBot && !isYou && (
                        <span>{player.connected ? 'Aktif' : 'Terputus'}</span>
                      )}
                      {player.inJail && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400 font-medium">Penjara</span>
                        </>
                      )}
                      {player.bankrupt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-rose-400 font-medium">Bangkrut</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {state.phase === 'LOBBY' && isHost && player.isBot ? (
                  <button
                    type="button"
                    onClick={() => onRemoveBot(player.id)}
                    className="p-1.5 rounded-lg text-[#F6F2E9]/50 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Hapus Bot"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-bold text-[#F6F2E9] tabular-nums">
                      {formatRp(player.cash)}
                    </div>
                    <div className="font-mono text-[10px] text-[#F6F2E9]/50 tabular-nums">
                      Aset {formatRp(netWorth)}
                    </div>
                  </div>
                )}
              </div>

              {/* Owned Property Swatches (clickable to inspect/build) */}
              {ownedTiles.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-[#F6F2E9]/8 flex flex-wrap gap-1.5">
                  {ownedTiles.map((tile) => {
                    const prop = state.properties[tile.index];
                    const hex = tile.district
                      ? DISTRICT_PALETTE[tile.district].hex
                      : '#64748B';
                    return (
                      <button
                        key={tile.index}
                        type="button"
                        onClick={() => onSelectTile(tile.index)}
                        title={`${tile.name}${prop?.houses ? ` (${prop.houses === 5 ? 'Hotel' : prop.houses + ' Rumah'})` : ''}`}
                        className="inline-flex items-center gap-1 rounded-md bg-[#08201A] hover:bg-[#174237] border border-[#F6F2E9]/12 px-1.5 py-0.5 text-[10px] text-[#F6F2E9]/85 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <span
                          className="w-2 h-2 rounded-xs shrink-0"
                          style={{ backgroundColor: hex }}
                        />
                        <span className="truncate max-w-[74px]">{tile.shortName}</span>
                        {prop && prop.houses > 0 && (
                          <span className="inline-flex items-center text-emerald-400 font-mono">
                            <Building2 className="w-2.5 h-2.5 mr-0.5" />
                            {prop.houses === 5 ? 'H' : prop.houses}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Host Lobby Bot Controls */}
        {state.phase === 'LOBBY' && isHost && state.players.length < 4 && (
          <button
            type="button"
            onClick={onAddBot}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#F6F2E9]/20 hover:border-[#E5A93C]/60 bg-[#0A221B]/60 hover:bg-[#12382E] py-2.5 px-3 text-xs font-semibold text-[#F6F2E9]/80 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-[#E5A93C]" />
            <Bot className="w-3.5 h-3.5 text-[#E5A93C]" />
            <span>Tambah Lawan Bot ({4 - state.players.length} slot)</span>
          </button>
        )}
      </div>

      {/* Subtle Bottom Tips */}
      <div className="pt-2.5 border-t border-[#F6F2E9]/10 text-[11px] text-[#F6F2E9]/55 leading-relaxed">
        Klik petak properti di papan atau daftar aset untuk membangun rumah dan hotel saat menguasai 1 warna distrik.
      </div>
    </aside>
  );
};
