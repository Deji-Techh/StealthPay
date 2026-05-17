'use client';

import { useEffect, useRef, useState } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'default' | 'bright';
}

const themeBorderColors = {
  subtle: {
    dark: 'rgba(255,255,255,0.04)',
    light: 'rgba(0,0,0,0.06)',
    dim: 'rgba(255,255,255,0.04)',
  },
  default: {
    dark: 'rgba(255,255,255,0.08)',
    light: 'rgba(0,0,0,0.1)',
    dim: 'rgba(255,255,255,0.06)',
  },
  bright: {
    dark: 'rgba(255,255,255,0.15)',
    light: 'rgba(0,0,0,0.15)',
    dim: 'rgba(255,255,255,0.1)',
  },
};

const themeBgColors = {
  subtle: {
    dark: 'rgba(255,255,255,0.01)',
    light: 'rgba(0,0,0,0.015)',
    dim: 'rgba(255,255,255,0.01)',
  },
  default: {
    dark: 'rgba(255,255,255,0.03)',
    light: 'rgba(0,0,0,0.03)',
    dim: 'rgba(255,255,255,0.02)',
  },
  bright: {
    dark: 'rgba(255,255,255,0.06)',
    light: 'rgba(0,0,0,0.04)',
    dim: 'rgba(255,255,255,0.035)',
  },
};

const themeGlow = {
  dark: 'rgba(255,255,255,0.06)',
  light: 'rgba(0,0,0,0.06)',
  dim: 'rgba(255,255,255,0.035)',
};

const themeShadow = {
  dark: '0 8px 32px rgba(0,0,0,0.4)',
  light: '0 8px 32px rgba(0,0,0,0.08)',
  dim: '0 8px 32px rgba(0,0,0,0.5)',
};

const themeShadowHover = {
  dark: '0 0 60px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.5)',
  light: '0 0 60px rgba(0,0,0,0.04), 0 20px 60px rgba(0,0,0,0.12)',
  dim: '0 0 60px rgba(255,255,255,0.02), 0 20px 60px rgba(0,0,0,0.6)',
};

const themeEdgeColor = {
  dark: 'rgba(255,255,255,0.2)',
  light: 'rgba(0,0,0,0.15)',
  dim: 'rgba(255,255,255,0.12)',
};

const themeDotColor = {
  dark: 'rgba(255,255,255,0.2)',
  light: 'rgba(0,0,0,0.12)',
  dim: 'rgba(255,255,255,0.12)',
};

export function GlassCard({
  children,
  className = '',
  intensity = 'default',
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light' | 'dim'>('dark');

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | 'dim' | null;
      if (t) setTheme(t);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const current = document.documentElement.getAttribute('data-theme');
    if (current) setTheme(current as 'dark' | 'light' | 'dim');

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    };
    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const borderColor = themeBorderColors[intensity][theme];
  const bgColor = themeBgColors[intensity][theme];
  const glow = themeGlow[theme];
  const shadow = isHovered ? themeShadowHover[theme] : themeShadow[theme];
  const edgeColor = themeEdgeColor[theme];
  const dotColor = themeDotColor[theme];

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${isHovered ? 'scale-[1.01]' : 'scale-100'}
        ${className}
      `}
      style={{
        background: `
          radial-gradient(
            600px circle at ${mousePos.x}% ${mousePos.y}%,
            ${isHovered ? glow : 'transparent'},
            transparent 40%
          ),
          linear-gradient(
            135deg,
            ${bgColor} 0%,
            transparent 50%,
            ${bgColor} 100%
          )
        `,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderColor}`,
        boxShadow: shadow,
      }}
    >
      {/* Top specular edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent" style={{ backgroundImage: `linear-gradient(90deg, transparent, ${edgeColor}, transparent)` }} />

      {/* Corner specular dots */}
      <div className="absolute top-3 left-3 w-1 h-1 rounded-full" style={{ backgroundColor: dotColor }} />
      <div className="absolute top-3 right-3 w-1 h-1 rounded-full" style={{ backgroundColor: dotColor }} />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
