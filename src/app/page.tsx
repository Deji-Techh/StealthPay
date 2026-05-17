'use client';

import { ChromeNav } from '@/components/ChromeNav';
import { GlassCard } from '@/components/GlassCard';
import { ChromeButton } from '@/components/ChromeButton';
import { useEffect, useState } from 'react';

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const steps = [
    {
      number: '01',
      title: 'REGISTER',
      desc: 'Generate your stealth keypair and publish your public meta-address to the ERC-6538 registry.',
    },
    {
      number: '02',
      title: 'SEND',
      desc: 'Look up any registered address. The app generates a one-time stealth wallet and transfers USDC.',
    },
    {
      number: '03',
      title: 'WITHDRAW',
      desc: 'Scan the chain for incoming payments. Derive the private key. Move funds to your real wallet.',
    },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background layers */}
      <div className="specular-field" />
      <div className="chrome-orb chrome-orb-1" />
      <div className="chrome-orb chrome-orb-2" />
      <div className="chrome-orb chrome-orb-3" />

      {/* Navigation */}
      <ChromeNav />

      {/* Hero */}
      <main className="relative z-10">
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
          {/* Eyebrow */}
          <div
            className={`
              transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '200ms' }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-white/30" />
              <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-white/30">
                ERC-5564 &middot; ERC-6538 &middot; LINEA
              </span>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-white/30" />
            </div>
          </div>

          {/* Main headline */}
          <div
            className={`
              transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '400ms' }}
          >
            <h1 className="text-center">
              <span
                className="
                  block font-['Bebas_Neue'] text-[clamp(4rem,12vw,10rem)]
                  leading-[0.85] tracking-[0.05em]
                  text-white
                "
                style={{
                  textShadow: '0 0 80px rgba(255,255,255,0.1)',
                }}
              >
                PRIVATE
              </span>
              <span
                className="
                  block font-['Bebas_Neue'] text-[clamp(4rem,12vw,10rem)]
                  leading-[0.85] tracking-[0.05em]
                  text-transparent
                  bg-clip-text
                "
                style={{
                  backgroundImage: 'linear-gradient(135deg, #fff 0%, #888 50%, #fff 100%)',
                  backgroundSize: '200% 200%',
                  animation: 'chrome-flow 6s ease infinite',
                }}
              >
                PAYMENTS
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div
            className={`
              transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '600ms' }}
          >
            <p className="mt-8 text-center max-w-lg mx-auto">
              <span className="font-['Sora'] text-sm font-light text-white/40 leading-relaxed">
                Send USDC to anyone using their stealth address.{' '}
                <span className="text-white/60">Nobody on-chain</span> can link the payment to the
                recipient. Financial privacy, finally on Linea.
              </span>
            </p>
          </div>

          {/* CTA */}
          <div
            className={`
              transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '800ms' }}
          >
            <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
              <a href="/register">
                <ChromeButton>Begin Registration</ChromeButton>
              </a>
              <ChromeButton variant="secondary">
                <span className="flex items-center gap-2">
                  How It Works
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </ChromeButton>
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            className={`
              absolute bottom-10 left-1/2 -translate-x-1/2
              transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
              ${mounted ? 'opacity-100' : 'opacity-0'}
            `}
            style={{ transitionDelay: '1200ms' }}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="font-['DM_Mono'] text-[10px] tracking-[0.3em] text-white/15 uppercase">
                Scroll
              </span>
              <div className="w-px h-12 bg-gradient-to-b from-white/20 to-transparent relative overflow-hidden">
                <div
                  className="absolute inset-x-0 top-0 h-4 bg-white/40"
                  style={{
                    animation: 'scroll-indicator 2s ease-in-out infinite',
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-32 px-6">
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-20">
              <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-white/25">
                THE PROTOCOL
              </span>
              <h2 className="mt-4 font-['Bebas_Neue'] text-5xl md:text-6xl tracking-[0.08em] text-white/90">
                HOW IT WORKS
              </h2>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, i) => (
                <GlassCard key={step.number} intensity={i === 0 ? 'bright' : 'default'}>
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <span
                        className="
                          font-['DM_Mono'] text-xs text-white/15
                        "
                      >
                        {step.number}
                      </span>
                      <div
                        className="
                          w-8 h-8 rounded-full flex items-center justify-center
                          font-['Sora'] text-[10px] font-bold text-black
                        "
                        style={{
                          background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                        }}
                      >
                        {i + 1}
                      </div>
                    </div>
                    <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-white/80 mb-3">
                      {step.title}
                    </h3>
                    <p className="font-['Sora'] text-xs font-light text-white/35 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </section>

        {/* Protocol section */}
        <section className="py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard intensity="bright">
              <div className="p-10 md:p-16">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-px bg-gradient-to-r from-transparent to-white/40" />
                  <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-white/30">
                    UNDER THE HOOD
                  </span>
                </div>

                <h3 className="font-['Bebas_Neue'] text-4xl md:text-5xl tracking-[0.08em] text-white/90 mb-6">
                  ECDH KEY DERIVATION
                </h3>

                <p className="font-['Sora'] text-sm font-light text-white/40 leading-relaxed max-w-2xl mb-8">
                  The same cryptography that powers end-to-end encrypted messaging. The sender uses your public
                  meta-address to generate a one-time wallet. Only you — with your private viewing key — can
                  derive the spending key and access the funds. The math guarantees it.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Standard', value: 'ERC-5564' },
                    { label: 'Registry', value: 'ERC-6538' },
                    { label: 'Curve', value: 'SECP256k1' },
                    { label: 'Network', value: 'LINEA' },
                  ].map((item) => (
                    <div key={item.label} className="space-y-1">
                      <span className="font-['Sora'] text-[9px] uppercase tracking-[0.2em] text-white/20">
                        {item.label}
                      </span>
                      <div className="font-['DM_Mono'] text-sm text-white/60">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-6 border-t border-white/[0.03]">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="font-['Bebas_Neue'] text-lg tracking-[0.15em] text-white/30">
              STEALTH<span className="text-white/15">PAY</span>
            </span>
            <span className="font-['DM_Mono'] text-[10px] tracking-wider text-white/15">
              MIT LICENSE &middot; BUILT FOR LINEA EVM HACKATHON
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
