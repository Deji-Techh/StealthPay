'use client';

import { useTheme, Theme } from '@/providers/ThemeProvider';
import { useState } from 'react';

const themeIcons: Record<Theme, React.ReactNode> = {
  dark: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  ),
  dim: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
  light: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  ),
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: Theme; label: string }[] = [
    { id: 'dark', label: 'Dark' },
    { id: 'dim', label: 'Dim' },
    { id: 'light', label: 'Light' },
  ];

  const themeColors: Record<Theme, string> = {
    dark: 'bg-white',
    dim: 'bg-white/50',
    light: 'bg-white',
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative flex items-center gap-1.5
          px-3 py-2 rounded-lg
          font-['Sora'] text-[10px] tracking-wider uppercase
          border border-white/10
          text-white/40 hover:text-white/70 hover:border-white/20
          transition-all duration-300
          cursor-pointer
        "
        style={{
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <span className="opacity-60">{themeIcons[theme]}</span>
        <span className="hidden sm:inline">{theme}</span>
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="
              absolute right-0 top-full mt-2 w-40
              rounded-xl overflow-hidden z-50
              border border-white/[0.08]
            "
            style={{
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

            {themes.map((t, i) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className="
                  w-full flex items-center gap-3 px-4 py-3
                  font-['Sora'] text-xs tracking-wider
                  transition-all duration-200
                  cursor-pointer
                  hover:bg-white/[0.04]
                "
                style={{
                  borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}
              >
                <div className="opacity-50">{themeIcons[t.id]}</div>
                <span className={theme === t.id ? 'text-white/80' : 'text-white/40'}>
                  {t.label}
                </span>
                {theme === t.id && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" className="ml-auto">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
