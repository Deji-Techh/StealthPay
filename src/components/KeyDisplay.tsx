'use client';

import { useState } from 'react';

interface KeyDisplayProps {
  label: string;
  value: string;
  truncated?: boolean;
  copyable?: boolean;
}

export function KeyDisplay({
  label,
  value,
  truncated = true,
  copyable = true,
}: KeyDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayValue = truncated && value.length > 30
    ? `${value.slice(0, 14)}...${value.slice(-12)}`
    : value;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-['Sora'] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
          {label}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="text-[10px] font-['DM_Mono'] tracking-wider text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors duration-300 cursor-pointer"
          >
            {copied ? 'COPIED' : 'COPY'}
          </button>
        )}
      </div>
      <div
        className="
          relative overflow-hidden rounded-lg
          px-4 py-3
          font-['DM_Mono'] text-xs tracking-wide
          text-[var(--text-secondary)]
          border border-[var(--input-border)]
          bg-[var(--input-bg)]
        "
      >
        {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--glass-highlight)] to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500" />

        <span className="relative z-10 break-all">{displayValue}</span>

        {/* Truncated full value on hover */}
        {truncated && (
          <span
            className="
              absolute inset-x-0 bottom-0 px-4 py-2
              font-['DM_Mono'] text-xs tracking-wide
              text-white/80
              bg-[#0a0a0a] border-t border-white/[0.06]
              opacity-0 hover:opacity-100
              transition-opacity duration-300
              pointer-events-none
              translate-y-full hover:translate-y-0
            "
            style={{
              opacity: 0,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '1';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.opacity = '0';
            }}
          >
            {value}
          </span>
        )}
      </div>
    </div>
  );
}
