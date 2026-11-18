import React, { useEffect, useState } from 'react';
import { ArrowRight, Compass, Users } from 'lucide-react';
import {
  PLAYER_TOKENS,
  PublicRoomSummary,
  TokenId,
} from '../shared/jakselBoard';
import { TokenIcon } from './TokenIcons';

interface TitleScreenProps {
  initialRoomCode?: string;
  onJoinRoom: (playerName: string, roomId: string, token: TokenId) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  initialRoomCode = '',
  onJoinRoom,
}) => {
  const [playerName, setPlayerName] = useState('Sultan Jaksel');
  const [roomId, setRoomId] = useState(initialRoomCode || 'JAKSEL-01');
  const [selectedToken, setSelectedToken] = useState<TokenId>('bajaj');
  const [openRooms, setOpenRooms] = useState<PublicRoomSummary[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/rooms')
      .then((res) => (res.ok ? res.json() : { rooms: [] }))
      .then((data: { rooms?: PublicRoomSummary[] }) => {
        if (active && Array.isArray(data.rooms)) {
          setOpenRooms(data.rooms);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = playerName.trim() || 'Pemain Jaksel';
    const cleanRoom = roomId.trim().toUpperCase() || 'JAKSEL-01';
    onJoinRoom(cleanName, cleanRoom, selectedToken);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#08241D] text-[#F6F2E9] flex items-center">
      {/* Key-Art Backdrop */}
      <div className="absolute inset-0">
        <img
          src="/src/assets/images/jaksel_skyline_backdrop_1794988347910.jpg"
          alt="Ilustrasi cakrawala Jakarta Selatan saat senja"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071F19] via-[#071F19]/88 to-[#071F19]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071F19] via-transparent to-[#071F19]/40" />
      </div>

      {/* Left Calm Negative-Space Content Column */}
      <div className="relative z-10 w-full max-w-2xl px-6 sm:px-12 lg:px-16 py-8 flex flex-col justify-center h-full">
        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-6">
          <svg
            viewBox="0 0 460 112"
            className="w-full max-w-[420px] h-auto"
            role="img"
            aria-label="Monopoli Jaksel"
          >
            <g transform="translate(8, 10)">
              <circle
                cx="42"
                cy="42"
                r="36"
                fill="#10342B"
                stroke="#E5A93C"
                strokeWidth="3"
              />
              <circle
                cx="42"
                cy="42"
                r="24"
                fill="none"
                stroke="#F6F2E9"
                strokeWidth="1.5"
                strokeDasharray="5 4"
                opacity="0.7"
              />
              <path
                d="M42 18L48 36L66 42L48 48L42 66L36 48L18 42L36 36L42 18Z"
                fill="#E5A93C"
              />
              <circle cx="42" cy="42" r="5" fill="#08241D" />
            </g>
            <text
              x="104"
              y="46"
              fill="#E5A93C"
              fontFamily="Plus Jakarta Sans, sans-serif"
              fontWeight="600"
              fontSize="13"
              letterSpacing="3.5"
            >
              EDISI PAPAN 3D KLASIK
            </text>
            <text
              x="102"
              y="88"
              fill="#F6F2E9"
              fontFamily="Bricolage Grotesque, sans-serif"
              fontWeight="800"
              fontSize="42"
              letterSpacing="-1"
            >
              MONOPOLI JAKSEL
            </text>
          </svg>
          <p className="mt-2 max-w-lg text-sm sm:text-base text-[#F6F2E9]/75 leading-relaxed">
            Kuasai distrik ikonik Jakarta Selatan di atas papan monopoli 3D klasik dengan
            ilustrasi monumen beranimasi di setiap petak, pion 3D, dan obrolan real-time.
          </p>
        </div>

        {/* Setup Form */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-lg bg-[#0D2C24]/90 border border-[#F6F2E9]/12 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label
                htmlFor="player-name"
                className="block text-xs font-medium text-[#F6F2E9]/70 mb-1.5"
              >
                Nama Pemain
              </label>
              <input
                id="player-name"
                type="text"
                maxLength={20}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Nama Anda..."
                className="w-full rounded-xl bg-[#08201A] border border-[#F6F2E9]/15 px-3.5 py-2.5 text-sm text-[#F6F2E9] placeholder-[#F6F2E9]/35 focus:outline-none focus:border-[#E5A93C]"
              />
            </div>

            <div>
              <label
                htmlFor="room-code"
                className="block text-xs font-medium text-[#F6F2E9]/70 mb-1.5"
              >
                Kode Meja
              </label>
              <div className="flex gap-2">
                <input
                  id="room-code"
                  type="text"
                  maxLength={14}
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  placeholder="JAKSEL-01"
                  className="w-full rounded-xl bg-[#08201A] border border-[#F6F2E9]/15 px-3.5 py-2.5 text-sm font-mono text-[#F6F2E9] placeholder-[#F6F2E9]/35 focus:outline-none focus:border-[#E5A93C]"
                />
                <button
                  type="button"
                  onClick={() =>
                    setRoomId(`JKS-${Math.floor(100 + Math.random() * 899)}`)
                  }
                  className="shrink-0 px-3 py-2 rounded-xl bg-[#153D33] hover:bg-[#1C4D40] text-xs font-medium text-[#F6F2E9] transition-colors whitespace-nowrap"
                  title="Buat kode meja acak"
                >
                  Acak
                </button>
              </div>
            </div>
          </div>

          {/* Token Selection */}
          <div>
            <span className="block text-xs font-medium text-[#F6F2E9]/70 mb-2">
              Pilih Pion Jakarta Selatan
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PLAYER_TOKENS.map((t) => {
                const active = selectedToken === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedToken(t.id)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-2.5 border text-center transition-transform duration-150 ${
                      active
                        ? 'bg-[#174237] border-[#E5A93C] scale-[1.02]'
                        : 'bg-[#08201A]/70 border-[#F6F2E9]/10 hover:border-[#F6F2E9]/30'
                    }`}
                  >
                    <TokenIcon token={t.id} size={32} />
                    <span className="text-xs font-semibold text-[#F6F2E9] leading-tight">
                      {t.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Open Rooms if any exist */}
          {openRooms.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center gap-1.5 text-xs text-[#F6F2E9]/65 mb-2">
                <Users className="w-3.5 h-3.5 text-[#E5A93C]" />
                <span>Meja aktif yang bisa langsung dimasuki</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {openRooms.slice(0, 4).map((rm) => (
                  <button
                    key={rm.roomId}
                    type="button"
                    onClick={() =>
                      onJoinRoom(
                        playerName.trim() || 'Pemain Jaksel',
                        rm.roomId,
                        selectedToken
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-[#12382E] hover:bg-[#194B3E] border border-[#F6F2E9]/12 px-3 py-1.5 text-xs text-[#F6F2E9] transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#E5A93C]" />
                    <span className="font-mono font-semibold">{rm.roomId}</span>
                    <span className="text-[#F6F2E9]/60">
                      {rm.playerCount}/4
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] active:scale-[0.99] text-[#08241D] font-bold text-sm sm:text-base py-3 px-6 transition-all shadow-lg cursor-pointer whitespace-nowrap"
          >
            <span>Masuk ke Meja Permainan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Single Flat Control-Hint Line */}
        <p className="mt-4 text-xs text-[#F6F2E9]/55 tracking-wide">
          Klik Petak untuk Detail Properti · Space Lempar Dadu · Enter Kirim Obrolan Real-Time
        </p>
      </div>
    </div>
  );
};
