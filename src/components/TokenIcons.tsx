import React from 'react';
import { TokenId } from '../shared/jakselBoard';

interface TokenIconProps {
  token: TokenId;
  className?: string;
  size?: number;
}

export const TokenIcon: React.FC<TokenIconProps> = ({
  token,
  className = '',
  size = 28,
}) => {
  if (token === 'bajaj') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="#E05A47" stroke="#FFF8EB" strokeWidth="2" />
        {/* Bajaj Cabin */}
        <path
          d="M9 21C9 15.5 12.5 12 18 12H23C25.5 12 27 14 27 17V21H9Z"
          fill="#FFF8EB"
        />
        <path d="M11 15.5H17V19H10.5L11 15.5Z" fill="#0F2E27" />
        <path d="M19 14.5H24.5V19H19V14.5Z" fill="#0F2E27" />
        {/* Wheels */}
        <circle cx="12.5" cy="23.5" r="2.7" fill="#182220" stroke="#FFF8EB" strokeWidth="1.2" />
        <circle cx="23.5" cy="23.5" r="2.7" fill="#182220" stroke="#FFF8EB" strokeWidth="1.2" />
        <circle cx="27.2" cy="19.5" r="1.3" fill="#FDE68A" />
      </svg>
    );
  }

  if (token === 'vespa') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="#E5A93C" stroke="#FFF8EB" strokeWidth="2" />
        {/* Vespa Silhouette */}
        <path
          d="M9.5 21.5C9.5 18 12 16 15.5 16H19.5L22.5 12H25.5L23.5 17.5C25.5 18 26.8 19.5 26.8 21.5H9.5Z"
          fill="#FFF8EB"
        />
        <rect x="12" y="13.8" width="5.5" height="2" rx="1" fill="#182220" />
        <circle cx="12.5" cy="23.5" r="2.8" fill="#182220" stroke="#FFF8EB" strokeWidth="1.2" />
        <circle cx="23.5" cy="23.5" r="2.8" fill="#182220" stroke="#FFF8EB" strokeWidth="1.2" />
        <circle cx="25.5" cy="13.2" r="1.4" fill="#FFF8EB" />
      </svg>
    );
  }

  if (token === 'mrt') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <circle cx="18" cy="18" r="16" fill="#14B8A6" stroke="#FFF8EB" strokeWidth="2" />
        {/* MRT Train Nose */}
        <rect x="11" y="9.5" width="14" height="16" rx="4.5" fill="#FFF8EB" />
        <path d="M13 13.5C13 12.4 13.9 11.5 15 11.5H21C22.1 11.5 23 12.4 23 13.5V17H13V13.5Z" fill="#0F2E27" />
        <rect x="11" y="19" width="14" height="2.2" fill="#2563EB" />
        <circle cx="14.5" cy="23" r="1.3" fill="#E5A93C" />
        <circle cx="21.5" cy="23" r="1.3" fill="#E5A93C" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle cx="18" cy="18" r="16" fill="#A855F7" stroke="#FFF8EB" strokeWidth="2" />
      {/* Iced Coffee Cup */}
      <path d="M12.5 14.5H23.5L22 25.5H14L12.5 14.5Z" fill="#FFF8EB" />
      <rect x="11.5" y="12.5" width="13" height="2.5" rx="1.2" fill="#E9D5FF" />
      <path d="M19.5 8.5L21 12.5H19L17.5 8.5H19.5Z" fill="#E5A93C" />
      <circle cx="18" cy="20" r="2.2" fill="#6B21A8" />
    </svg>
  );
};

interface DiceFaceProps {
  value: number;
  rolling?: boolean;
  size?: number;
}

const PIP_MAP: Record<number, Array<[number, number]>> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 26],
    [72, 26],
    [28, 50],
    [72, 50],
    [28, 74],
    [72, 74],
  ],
};

export const DiceFace: React.FC<DiceFaceProps> = ({
  value,
  rolling = false,
  size = 44,
}) => {
  const pips = PIP_MAP[value] ?? PIP_MAP[1];
  return (
    <div
      className={`inline-flex items-center justify-center rounded-xl bg-[#F6F2E9] shadow-[0_4px_12px_rgba(0,0,0,0.45),inset_0_-2px_0_rgba(0,0,0,0.15)] border border-white/60 ${
        rolling ? 'animate-dice-tumble' : 'transition-transform duration-200'
      }`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {pips.map(([cx, cy], idx) => (
          <circle
            key={idx}
            cx={cx}
            cy={cy}
            r={value === 1 ? 11 : 8.5}
            fill={value === 1 ? '#E05A47' : '#182220'}
          />
        ))}
      </svg>
    </div>
  );
};
