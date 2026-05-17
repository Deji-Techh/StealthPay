'use client';

import { use, useState, useCallback, useEffect } from 'react';
import { ChromeNav } from '@/components/ChromeNav';
import { GlassCard } from '@/components/GlassCard';
import { ChromeButton } from '@/components/ChromeButton';
import { KeyDisplay } from '@/components/KeyDisplay';
import { generateStealthAddressFromMeta } from '@/lib/stealth';
import { NETWORKS, ERC20_ABI, USDC_DECIMALS, SCHEME_ID } from '@/lib/constants';
import type { Hex, Address } from 'viem';

type Step = 'input' | 'confirm' | 'sending' | 'success';

interface PayPageProps {
  params: Promise<{ address: string }>;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default function PayPage({ params }: PayPageProps) {
  const resolvedParams = use(params);
  const [step, setStep] = useState<Step>('input');
  const [amount, setAmount] = useState('');
  const [chainId, setChainId] = useState<number>(59141);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Stealth data
  const [stealthData, setStealthData] = useState<{
    stealthAddress: Address;
    ephemeralPublicKey: Hex;
    viewTag: Hex;
  } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Decode recipient meta-address from URL
  const rawAddress = resolvedParams.address;
  const recipientMetaAddress = decodeURIComponent(rawAddress);

  const network = NETWORKS[chainId === 59144 ? 'mainnet' : 'sepolia'];

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        }
      } catch {}
    };
    checkWallet();

    const handleChainChanged = (newChainId: string) => setChainId(parseInt(newChainId, 16));
    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
    }
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      setError('No wallet detected.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
      setError(null);
      handleGenerate();
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }

    try {
      const stealth = generateStealthAddressFromMeta(chainId, recipientMetaAddress as Hex);
      setStealthData(stealth);
      setStep('confirm');
      setError(null);
    } catch (err: any) {
      setError('Invalid stealth meta-address format');
    }
  }, [amount, chainId, recipientMetaAddress]);

  const executeSend = useCallback(async () => {
    if (!stealthData || !walletAddress) return;

    setStep('sending');
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected');
      }

      const amountWei = BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS));

      // Encode USDC transfer
      const paddedAddress = stealthData.stealthAddress.slice(2).padStart(64, '0');
      const paddedAmount = amountWei.toString(16).padStart(64, '0');
      const transferData = `0xa9059cbb${paddedAddress}${paddedAmount}`;

      // 1. Transfer USDC
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: network.usdc,
          data: transferData,
        }],
      });

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Announce
      const ephemeralKeyBytes = stealthData.ephemeralPublicKey.slice(2);
      const ephemeralLength = (ephemeralKeyBytes.length / 2).toString(16).padStart(64, '0');
      const ephemeralPadded = ephemeralKeyBytes.padEnd(Math.ceil(ephemeralKeyBytes.length / 64) * 64, '0');

      const viewTagBytes = stealthData.viewTag.slice(2);
      const metadataLength = (viewTagBytes.length / 2).toString(16).padStart(64, '0');
      const metadataPadded = viewTagBytes.padEnd(64, '0');

      const ephemeralOffset = 3 * 32 + 32;
      const metadataOffset = ephemeralOffset + 1 + Math.ceil(ephemeralKeyBytes.length / 32) * 32;

      const announceData = `0x0b44babf${
        SCHEME_ID.toString(16).padStart(64, '0')
      }${
        stealthData.stealthAddress.slice(2).padStart(64, '0')
      }${
        ephemeralOffset.toString(16).padStart(64, '0')
      }${
        metadataOffset.toString(16).padStart(64, '0')
      }${ephemeralLength}${ephemeralPadded}${metadataLength}${metadataPadded}`;

      const announceTxHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: network.announcer,
          data: announceData,
        }],
      });

      setTxHash(announceTxHash as string);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStep('confirm');
    }
  }, [stealthData, walletAddress, amount, network]);

  const explorerUrl = txHash ? `${network.explorerUrl}/tx/${txHash}` : null;

  return (
    <div className="relative min-h-screen">
      <div className="specular-field opacity-[var(--specular-opacity)]" />
      <div className="chrome-orb chrome-orb-1" />
      <div className="chrome-orb chrome-orb-2" />

      <ChromeNav />

      <main className="relative z-10 max-w-2xl mx-auto px-6 pt-32 pb-20">
        {/* Page header */}
        <div className="text-center mb-12">
          <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-dim)]">
            PRIVATE PAYMENT LINK
          </span>
          <h1 className="mt-4 font-['Bebas_Neue'] text-5xl md:text-6xl tracking-[0.08em] text-[var(--text-primary)]">
            SEND TO RECIPIENT
          </h1>
          <p className="mt-4 font-['Sora'] text-sm font-light text-[var(--text-tertiary)] max-w-md mx-auto">
            Enter the amount to send privately. The recipient's stealth address is pre-loaded from this link.
          </p>
        </div>

        {/* Network selector */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setChainId(59141)}
            className={`
              px-4 py-2 rounded-lg font-['Sora'] text-xs tracking-wider transition-all duration-300
              ${chainId === 59141
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[var(--text-tertiary)] hover:text-white/50 border border-transparent'
              }
            `}
          >
            TESTNET
          </button>
          <button
            onClick={() => setChainId(59144)}
            className={`
              px-4 py-2 rounded-lg font-['Sora'] text-xs tracking-wider transition-all duration-300 flex items-center gap-2
              ${chainId === 59144
                ? 'bg-white/10 text-white border border-white/20'
                : 'text-[var(--text-tertiary)] hover:text-white/50 border border-transparent'
              }
            `}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
            MAINNET
          </button>
        </div>

        {/* Recipient meta-address display */}
        <div className="mb-6">
          <KeyDisplay label="Recipient" value={recipientMetaAddress} truncated />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
            <p className="font-['Sora'] text-xs text-red-400/80">{error}</p>
          </div>
        )}

        {/* Not connected */}
        {!walletConnected && step === 'input' && (
          <GlassCard>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                CONNECT TO SEND
              </h3>
              <ChromeButton onClick={connectWallet}>Connect Wallet</ChromeButton>
            </div>
          </GlassCard>
        )}

        {/* Input */}
        {walletConnected && step === 'input' && (
          <GlassCard intensity="bright">
            <div className="p-8 space-y-6">
              <div>
                <label className="block font-['Sora'] text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">
                  AMOUNT (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="
                      w-full px-4 py-3 pr-16 rounded-xl
                      font-['DM_Mono'] text-sm tracking-wide
                      text-[var(--text-primary)] placeholder:text-[var(--text-dim)]
                      bg-white/[0.03] border border-white/[0.06]
                      focus:border-white/20 focus:outline-none
                      transition-colors duration-300
                    "
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-['Sora'] text-xs text-[var(--text-tertiary)]">
                    USDC
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="font-['Sora'] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                  NETWORK
                </span>
                <span className="font-['DM_Mono'] text-xs text-white/50 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${chainId === 59144 ? 'bg-emerald-400/60' : 'bg-amber-400/60'}`} />
                  {network.name}
                </span>
              </div>

              <ChromeButton onClick={handleGenerate}>
                <span className="flex items-center gap-2">
                  Generate Stealth Address
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </ChromeButton>
            </div>
          </GlassCard>
        )}

        {/* Confirm */}
        {walletConnected && step === 'confirm' && stealthData && (
          <GlassCard intensity="bright">
            <div className="p-8 space-y-6">
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)]">
                CONFIRM PRIVATE TRANSFER
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="font-['Sora'] text-xs text-[var(--text-tertiary)]">Amount</span>
                  <span className="font-['DM_Mono'] text-sm text-[var(--text-primary)]">{amount} USDC</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="font-['Sora'] text-xs text-[var(--text-tertiary)]">Network</span>
                  <span className="font-['DM_Mono'] text-xs text-[var(--text-secondary)]">{network.name}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="font-['Sora'] text-xs text-[var(--text-tertiary)]">Privacy</span>
                  <span className="font-['Sora'] text-xs text-emerald-400/70">Fully Private</span>
                </div>
              </div>

              <KeyDisplay label="Stealth Address" value={stealthData.stealthAddress} truncated />

              <div className="flex flex-col sm:flex-row gap-4">
                <ChromeButton onClick={executeSend}>
                  <span className="flex items-center gap-2">
                    Confirm & Send
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                    </svg>
                  </span>
                </ChromeButton>
                <ChromeButton variant="secondary" onClick={() => setStep('input')}>
                  Back
                </ChromeButton>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Sending */}
        {walletConnected && step === 'sending' && (
          <GlassCard>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" className="animate-spin">
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
                  <path d="M12 2a10 10 0 0110 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                SENDING
              </h3>
              <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)]">
                Please approve both transactions in your wallet...
              </p>
            </div>
          </GlassCard>
        )}

        {/* Success */}
        {walletConnected && step === 'success' && stealthData && (
          <GlassCard intensity="bright">
            <div className="p-8 text-center">
              <div
                className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                  boxShadow: '0 0 40px rgba(255,255,255,0.15)',
                }}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                PAYMENT SENT
              </h3>
              <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-6 max-w-sm mx-auto">
                {amount} USDC sent privately. Only the recipient can access these funds.
              </p>

              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="
                    inline-flex items-center gap-2
                    font-['DM_Mono'] text-xs tracking-wider
                    text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]
                    transition-colors duration-300
                    border-b border-white/10 hover:border-white/30
                    pb-0.5 mb-6
                  "
                >
                  View on Explorer
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              <div className="flex gap-4 justify-center">
                <ChromeButton onClick={() => {
                  setStep('input');
                  setAmount('');
                  setStealthData(null);
                  setTxHash(null);
                }}>
                  Send Another
                </ChromeButton>
              </div>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
