'use client';

import { useState, useEffect } from 'react';

export function ChromeNav() {
  const [scrolled, setScrolled] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [address, setAddress] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Send', href: '/send' },
    { label: 'Inbox', href: '/inbox' },
    { label: 'Register', href: '/register' },
  ];

  return (
    <nav
      className={`
        fixed top-0 inset-x-0 z-50
        transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
        ${scrolled ? 'py-3' : 'py-5'}
      `}
      style={{
        background: scrolled
          ? 'linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 100%)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div
              className="w-8 h-8 rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #fff 0%, #ccc 50%, #fff 100%)',
                boxShadow: '0 0 20px rgba(255,255,255,0.1)',
              }}
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/30 to-transparent" />
          </div>
          <span
            className="
              font-['Bebas_Neue'] text-xl tracking-[0.15em]
              text-white/90
              group-hover:text-white
              transition-colors duration-300
            "
          >
            STEALTH<span className="text-white/40">PAY</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="
                relative font-['Sora'] text-xs font-medium tracking-wider uppercase
                text-white/35 hover:text-white/80
                transition-colors duration-300
                py-2
              "
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Wallet button */}
        <button
          onClick={() => {
            if (!walletConnected) {
              setWalletConnected(true);
              setAddress('0x7a2F...8b3E');
            }
          }}
          className="
            relative overflow-hidden px-6 py-2.5 rounded-xl
            font-['Sora'] text-xs font-medium tracking-wider uppercase
            border border-white/10
            text-white/60 hover:text-white hover:border-white/25
            transition-all duration-500
            cursor-pointer
          "
          style={{
            background: walletConnected
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
          }}
        >
          {walletConnected ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
              {address}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="6" width="20" height="14" rx="2" />
                <path d="M16 14h.01" />
                <path d="M2 10h20" />
              </svg>
              Connect Wallet
            </span>
          )}

          {/* Specular top edge */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </button>
      </div>
    </nav>
  );
}
