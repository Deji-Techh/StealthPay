'use client';

import { useEffect, useRef, useState } from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'subtle' | 'default' | 'bright';
}

export function GlassCard({
  children,
  className = '',
  intensity = 'default',
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

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

  const borderIntensity = {
    subtle: 'rgba(255,255,255,0.04)',
    default: 'rgba(255,255,255,0.08)',
    bright: 'rgba(255,255,255,0.15)',
  }[intensity];

  const bgIntensity = {
    subtle: 'rgba(255,255,255,0.01)',
    default: 'rgba(255,255,255,0.03)',
    bright: 'rgba(255,255,255,0.06)',
  }[intensity];

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
            ${isHovered ? 'rgba(255,255,255,0.06)' : 'transparent'},
            transparent 40%
          ),
          linear-gradient(
            135deg,
            ${bgIntensity} 0%,
            rgba(255,255,255,0.01) 50%,
            ${bgIntensity} 100%
          )
        `,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${borderIntensity}`,
        boxShadow: isHovered
          ? '0 0 60px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.5)'
          : '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Top specular edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      {/* Corner specular dots */}
      <div className="absolute top-3 left-3 w-1 h-1 rounded-full bg-white/20" />
      <div className="absolute top-3 right-3 w-1 h-1 rounded-full bg-white/20" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
