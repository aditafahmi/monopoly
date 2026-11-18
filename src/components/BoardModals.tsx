import React from 'react';
import { Building2, Home, Landmark, ShieldAlert, Trophy, X } from 'lucide-react';
import {
  DISTRICT_PALETTE,
  DrawnCardEvent,
  JAKSEL_TILES,
  RoomState,
  calculateNetWorth,
  formatRp,
  getDistrictTiles,
} from '../shared/jakselBoard';
import { TokenIcon } from './TokenIcons';

interface PropertyInspectorModalProps {
  tileIndex: number | null;
  state: RoomState;
  yourPlayerId: string | null;
  onClose: () => void;
  onBuildHouse: (tileIndex: number) => void;
  onSellHouse: (tileIndex: number) => void;
  onToggleMortgage: (tileIndex: number) => void;
}

export const PropertyInspectorModal: React.FC<PropertyInspectorModalProps> = ({
  tileIndex,
  state,
  yourPlayerId,
  onClose,
  onBuildHouse,
  onSellHouse,
  onToggleMortgage,
}) => {
  if (tileIndex === null) return null;
  const tile = JAKSEL_TILES[tileIndex];
  if (!tile) return null;

  const prop = state.properties[tileIndex];
  const owner = prop?.ownerId
    ? state.players.find((p) => p.id === prop.ownerId)
    : null;
  const currentPlayer = state.players[state.currentTurnIndex];
  const isOwnerTurn =
    Boolean(yourPlayerId && prop?.ownerId === yourPlayerId && currentPlayer?.id === yourPlayerId) &&
    (state.phase === 'END_TURN' || state.phase === 'ROLL');

  const bandHex = tile.district
    ? DISTRICT_PALETTE[tile.district].hex
    : '#334155';

  let ownsFullSet = false;
  if (tile.category === 'PROPERTY' && tile.district && yourPlayerId) {
    const group = getDistrictTiles(tile.district);
    ownsFullSet = group.every(
      (t) =>
        state.properties[t.index]?.ownerId === yourPlayerId &&
        !state.properties[t.index]?.mortgaged
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-[#F6F2E9] text-[#162420] shadow-2xl overflow-hidden border border-white/40"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{
            backgroundColor: bandHex,
            color: tile.district ? DISTRICT_PALETTE[tile.district].textOnBand : '#FFFFFF',
          }}
        >
          <div>
            <div className="text-[11px] font-semibold opacity-85">
              {tile.district ? DISTRICT_PALETTE[tile.district].label : tile.sublabel}
            </div>
            <h3 className="font-display text-xl font-extrabold leading-tight">
              {tile.name}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail properti"
            className="p-1.5 rounded-lg bg-black/15 hover:bg-black/25 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {tile.price ? (
            <>
              <div className="flex items-center justify-between text-sm border-b border-[#162420]/10 pb-2.5">
                <span className="text-[#162420]/70 font-medium">Harga Beli</span>
                <span className="font-mono font-bold tabular-nums">
                  {formatRp(tile.price)}
                </span>
              </div>

              {tile.category === 'PROPERTY' && tile.rent && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#162420]/70">Sewa Dasar (2x jika 1 set)</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatRp(tile.rent[0])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#162420]/70">Dengan 1 Rumah</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatRp(tile.rent[1])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#162420]/70">Dengan 2 Rumah</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatRp(tile.rent[2])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#162420]/70">Dengan 3 Rumah</span>
                    <span className="font-mono font-semibold tabular-nums">
                      {formatRp(tile.rent[3])}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#162420]/70">Dengan Hotel</span>
                    <span className="font-mono font-bold text-[#E05A47] tabular-nums">
                      {formatRp(tile.rent[4])}
                    </span>
                  </div>
                  {tile.houseCost && (
                    <div className="flex justify-between pt-2 border-t border-[#162420]/10">
                      <span className="text-[#162420]/70">Biaya Bangun Rumah/Hotel</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {formatRp(tile.houseCost)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {tile.category === 'TRANSIT' && (
                <div className="text-xs text-[#162420]/80 space-y-1">
                  <div>1 Stasiun: Rp 25 Jt · 2 Stasiun: Rp 50 Jt</div>
                  <div>3 Stasiun: Rp 100 Jt · 4 Stasiun: Rp 200 Jt</div>
                </div>
              )}

              {tile.category === 'UTILITY' && (
                <p className="text-xs text-[#162420]/80 leading-relaxed">
                  Sewa sebesar 4x angka dadu (atau 10x angka dadu jika memiliki PLN dan PAM Jaya sekaligus).
                </p>
              )}

              <div className="rounded-xl bg-[#EAE4D7] px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="text-[#162420]/70 font-medium">Pemilik</span>
                {owner ? (
                  <span className="inline-flex items-center gap-1.5 font-bold">
                    <TokenIcon token={owner.token} size={18} />
                    <span>{owner.name}</span>
                    {prop?.mortgaged && <span className="text-rose-700">(Digadai)</span>}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800">Tersedia di Pasar</span>
                )}
              </div>

              {isOwnerTurn && prop && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tile.category === 'PROPERTY' && (
                    <>
                      <button
                        type="button"
                        disabled={
                          !ownsFullSet ||
                          prop.houses >= 5 ||
                          (currentPlayer?.cash ?? 0) < (tile.houseCost ?? 9999)
                        }
                        onClick={() => onBuildHouse(tile.index)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white text-xs font-bold py-2.5 px-3 cursor-pointer whitespace-nowrap"
                      >
                        {prop.houses >= 4 ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : (
                          <Home className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {prop.houses === 5
                            ? 'Maksimal Hotel'
                            : prop.houses === 4
                            ? `Bangun Hotel (${formatRp(tile.houseCost ?? 0)})`
                            : `Bangun Rumah (${formatRp(tile.houseCost ?? 0)})`}
                        </span>
                      </button>
                      {prop.houses > 0 && (
                        <button
                          type="button"
                          onClick={() => onSellHouse(tile.index)}
                          className="rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold py-2.5 px-3 cursor-pointer whitespace-nowrap"
                        >
                          Jual Bangunan
                        </button>
                      )}
                    </>
                  )}
                  {prop.houses === 0 && (
                    <button
                      type="button"
                      onClick={() => onToggleMortgage(tile.index)}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#162420] hover:bg-[#233832] text-[#F6F2E9] text-xs font-semibold py-2.5 px-3 cursor-pointer whitespace-nowrap"
                    >
                      <Landmark className="w-3.5 h-3.5" />
                      <span>
                        {prop.mortgaged
                          ? `Tebus Gadai (${formatRp(Math.ceil((tile.price ?? 0) * 0.55))})`
                          : `Gadaikan (+${formatRp(Math.floor((tile.price ?? 0) * 0.5))})`}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-[#162420]/80 leading-relaxed">
              {tile.sublabel}. Petak khusus di lingkar Jakarta Selatan.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

interface CardToastProps {
  cardEvent: DrawnCardEvent | null;
  onDismiss: () => void;
}

export const DrawnCardToast: React.FC<CardToastProps> = ({
  cardEvent,
  onDismiss,
}) => {
  if (!cardEvent) return null;
  const isChance = cardEvent.card.deck === 'CHANCE';

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-30 w-[min(92vw,380px)] rounded-2xl bg-[#0F3128] border border-[#E5A93C]/60 shadow-2xl p-4 text-[#F6F2E9]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono font-semibold text-[#E5A93C]">
            {isChance ? 'KARTU KESEMPATAN' : 'DANA KOMUNITAS'} · {cardEvent.playerName}
          </div>
          <h4 className="font-display text-base font-bold mt-0.5">
            {cardEvent.card.title}
          </h4>
          <p className="text-xs text-[#F6F2E9]/80 mt-1 leading-relaxed">
            {cardEvent.card.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Tutup kartu"
          className="p-1 rounded-lg hover:bg-white/10 text-[#F6F2E9]/60 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface RulesModalProps {
  open: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-[#0C2921] border border-[#F6F2E9]/15 text-[#F6F2E9] p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F6F2E9]/10 pb-3">
          <h3 className="font-display text-xl font-bold">
            Panduan Monopoli Jaksel
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup panduan"
            className="p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <ul className="space-y-2.5 text-sm text-[#F6F2E9]/85 leading-relaxed list-disc pl-5">
          <li>
            Semua pemain mulai dari <strong>Bundaran Senayan (Mulai)</strong> dengan modal awal{' '}
            <span className="font-mono text-[#E5A93C]">Rp 1.500 Jt</span>.
          </li>
          <li>
            Setiap melewati petak <strong>Mulai</strong>, Anda otomatis menerima dana segar{' '}
            <span className="font-mono text-emerald-400">+Rp 200 Jt</span>.
          </li>
          <li>
            Kuasai semua properti dalam satu warna distrik (misalnya <em>Senopati &amp; Gunawarman</em>) untuk menggandakan sewa dasar serta membangun Rumah hingga Hotel.
          </li>
          <li>
            Pajak dan denda terkumpul di <strong>Taman Literasi (Parkir Gratis)</strong> dan bisa diklaim oleh pemain yang mendarat di sana.
          </li>
          <li>
            Gunakan panel <strong>Obrolan Real-Time</strong> di sisi kanan untuk berdiskusi, menawar, atau bercanda langsung dengan pemain lain di meja.
          </li>
        </ul>
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] text-[#08241D] font-bold text-sm py-2.5 cursor-pointer"
        >
          Mengerti, Lanjut Main
        </button>
      </div>
    </div>
  );
};

interface GameOverModalProps {
  state: RoomState;
  onPlayAgain: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  onPlayAgain,
}) => {
  if (state.phase !== 'GAME_OVER') return null;

  const sorted = [...state.players].sort((a, b) => {
    if (a.id === state.winnerId) return -1;
    if (b.id === state.winnerId) return 1;
    return (
      calculateNetWorth(b, state.properties) -
      calculateNetWorth(a, state.properties)
    );
  });
  const winner = sorted[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#0C2921] border border-[#E5A93C]/50 p-6 text-[#F6F2E9] shadow-2xl space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#E5A93C]/15 border border-[#E5A93C]/40 text-[#E5A93C]">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-[#E5A93C]">
            Permainan Selesai
          </div>
          <h2 className="font-display text-2xl font-extrabold">
            {winner?.name ?? 'Pemenang'} Menguasai Jaksel!
          </h2>
        </div>

        <div className="space-y-2">
          {sorted.map((p, idx) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-[#08201A] border border-[#F6F2E9]/10 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs text-[#E5A93C] w-4">
                  {idx + 1}.
                </span>
                <TokenIcon token={p.token} size={24} />
                <div>
                  <div className="text-sm font-semibold">{p.name}</div>
                  {p.bankrupt && (
                    <div className="text-[11px] text-rose-400 inline-flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" /> Bangkrut
                    </div>
                  )}
                </div>
              </div>
              <div className="font-mono text-sm font-bold tabular-nums">
                {formatRp(calculateNetWorth(p, state.properties))}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] text-[#08241D] font-bold text-sm py-3 cursor-pointer"
        >
          Main Lagi
        </button>
      </div>
    </div>
  );
};
