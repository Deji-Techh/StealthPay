'use client';

import { useState } from 'react';

interface ChromeButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  className?: string;
  type?: 'button' | 'submit';
}

export function ChromeButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  className = '',
  type = 'button',
}: ChromeButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newRipple = { id: Date.now(), x, y };
    setRipples((prev) => [...prev, newRipple]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
    }, 600);

    onClick?.();
  };

  if (variant === 'secondary') {
    return (
      <button
        type={type}
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative overflow-hidden px-8 py-3.5
          font-['Sora'] font-medium text-sm tracking-wider uppercase
          text-white/70 transition-all duration-300
          border border-white/10 rounded-xl
          hover:text-white hover:border-white/25 hover:bg-white/[0.04]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-white/70 disabled:hover:border-white/10
          active:scale-[0.98]
          ${className}
        `}
      >
        <div className="relative z-10">{children}</div>
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        group relative overflow-hidden
        px-8 py-3.5 min-w-[200px]
        font-['Sora'] font-semibold text-sm tracking-wider uppercase
        text-black rounded-xl
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        disabled:opacity-30 disabled:cursor-not-allowed
        active:scale-[0.98]
        ${className}
      `}
      style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 25%, #f5f5f5 50%, #d0d0d0 75%, #ffffff 100%)',
        backgroundSize: '200% 200%',
        animation: isHovered ? 'chrome-flow 2s ease infinite' : 'none',
        boxShadow: isHovered
          ? '0 0 30px rgba(255,255,255,0.15), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
    >
      {/* Specular highlight top edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

      {/* Light sweep on hover */}
      {isHovered && (
        <div
          className="absolute inset-0 w-[60%] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
          style={{
            animation: 'light-sweep 1.2s ease-in-out forwards',
            transform: 'skewX(-15deg)',
          }}
        />
      )}

      {/* Chrome ripples */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            animation: 'ripple-expand 0.6s ease-out forwards',
          }}
        />
      ))}

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
