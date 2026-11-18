import React, { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { ChatMessage } from '../shared/jakselBoard';
import { TokenIcon } from './TokenIcons';

interface ChatAndLogPanelProps {
  messages: ChatMessage[];
  connected: boolean;
  yourPlayerId: string | null;
  onSendMessage: (text: string) => void;
}

const QUICK_PHRASES = [
  'Gaspol!',
  'Bayar sewa dong',
  'Awas SCBD',
  'Mampir Senopati yuk',
];

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ChatAndLogPanel: React.FC<ChatAndLogPanelProps> = ({
  messages,
  connected,
  yourPlayerId,
  onSendMessage,
}) => {
  const [filter, setFilter] = useState<'all' | 'user'>('all');
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  const visibleMessages =
    filter === 'user'
      ? messages.filter((m) => m.type === 'user')
      : messages;

  useEffect(() => {
    const el = listRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [visibleMessages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    onSendMessage(clean);
    setDraft('');
  };

  return (
    <aside className="flex flex-col h-full bg-[#0C2921]/95 border border-[#F6F2E9]/10 rounded-2xl p-4 overflow-hidden">
      {/* Header with genuine WebSocket status & filter tabs */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F6F2E9]/10">
        <div>
          <h2 className="font-display text-sm font-bold text-[#F6F2E9]">
            Obrolan Real-Time
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-[#F6F2E9]/60 mt-0.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                connected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>{connected ? 'Terhubung via WebSocket' : 'Menyambung ulang...'}</span>
          </div>
        </div>

        {/* Functional Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#08201A] border border-[#F6F2E9]/10">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'all'
                ? 'bg-[#174237] text-[#F6F2E9]'
                : 'text-[#F6F2E9]/60 hover:text-[#F6F2E9]'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilter('user')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              filter === 'user'
                ? 'bg-[#174237] text-[#F6F2E9]'
                : 'text-[#F6F2E9]/60 hover:text-[#F6F2E9]'
            }`}
          >
            Chat
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto jaksel-scroll py-3 space-y-2.5 pr-1"
      >
        {visibleMessages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-xs text-[#F6F2E9]/45 leading-relaxed">
              Belum ada pesan obrolan. Sapa pemain lain di meja secara real-time!
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            if (msg.type === 'system') {
              return (
                <div
                  key={msg.id}
                  className="text-xs text-[#F6F2E9]/70 bg-[#08201A]/70 border border-[#F6F2E9]/8 rounded-lg px-3 py-2 leading-snug"
                >
                  <span className="font-mono text-[10px] text-[#E5A93C] mr-1.5 tabular-nums">
                    {formatTime(msg.timestamp)}
                  </span>
                  <span>{msg.text}</span>
                </div>
              );
            }

            const isMine = msg.senderId === yourPlayerId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-[#F6F2E9]/65">
                  {msg.senderToken && !isMine && (
                    <TokenIcon token={msg.senderToken} size={15} />
                  )}
                  <span
                    className="font-semibold"
                    style={{ color: isMine ? '#E5A93C' : msg.senderColor }}
                  >
                    {isMine ? 'Anda' : msg.senderName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-[10px] tabular-nums">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 text-xs sm:text-[13px] leading-snug break-words ${
                    isMine
                      ? 'bg-[#174237] text-[#F6F2E9] border border-[#E5A93C]/30'
                      : 'bg-[#08201A] text-[#F6F2E9]/95 border border-[#F6F2E9]/10'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Jaksel Chat Phrases */}
      <div className="pt-2 pb-2 border-t border-[#F6F2E9]/10 flex flex-wrap gap-1.5">
        {QUICK_PHRASES.map((phrase) => (
          <button
            key={phrase}
            type="button"
            disabled={!connected}
            onClick={() => onSendMessage(phrase)}
            className="rounded-lg bg-[#12382E] hover:bg-[#194B3E] disabled:opacity-40 px-2 py-1 text-[11px] font-medium text-[#F6F2E9]/85 transition-colors cursor-pointer whitespace-nowrap"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Chat Composer */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <input
          type="text"
          maxLength={240}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          disabled={!connected}
          placeholder={
            connected ? 'Tulis pesan real-time...' : 'Menghubungkan chat...'
          }
          className="flex-1 min-w-0 rounded-xl bg-[#08201A] border border-[#F6F2E9]/15 px-3 py-2 text-xs sm:text-sm text-[#F6F2E9] placeholder-[#F6F2E9]/40 focus:outline-none focus:border-[#E5A93C]"
        />
        <button
          type="submit"
          disabled={!connected || !draft.trim()}
          aria-label="Kirim pesan"
          className="shrink-0 inline-flex items-center justify-center rounded-xl bg-[#E5A93C] hover:bg-[#EEB64E] disabled:opacity-40 disabled:cursor-not-allowed text-[#08241D] p-2.5 transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
