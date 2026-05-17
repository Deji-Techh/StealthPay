'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChromeNav } from '@/components/ChromeNav';
import { GlassCard } from '@/components/GlassCard';
import { ChromeButton } from '@/components/ChromeButton';
import { KeyDisplay } from '@/components/KeyDisplay';
import { generateRandomKeys } from '@/lib/stealth';
import { NETWORKS, SCHEME_ID, encodeRegisterKeys } from '@/lib/constants';
import { storeKeys, loadStoredKeys, clearStoredKeys, type StoredKeys } from '@/lib/storage';
import type { Hex } from 'viem';

type Step = 'connect' | 'generate' | 'preview' | 'register' | 'success';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('connect');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState<number>(59141);
  const [keys, setKeys] = useState<StoredKeys | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = NETWORKS[chainId === 59144 ? 'mainnet' : 'sepolia'];

  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const check = async () => {
      try {
        const accounts = await window.ethereum!.request({ method: 'eth_accounts' });
        if (accounts.length > 0) { setWalletAddress(accounts[0]); setWalletConnected(true); }
      } catch {}
    };
    check();

    const handleChainChanged = (newChainId: string) => {
      const cid = parseInt(newChainId, 16);
      setChainId(cid); setStep('connect'); setKeys(null); setTxHash(null);
    };
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) { setWalletAddress(accounts[0]); setWalletConnected(true); }
      else { setWalletConnected(false); setStep('connect'); }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum!.removeListener('chainChanged', handleChainChanged);
      window.ethereum!.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) { setError('No wallet detected.'); return; }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]); setWalletConnected(true); setError(null); setStep('generate');
    } catch (err: any) { setError(err.message || 'Failed to connect'); }
  }, []);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    setError(null);
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: `0x${targetChainId.toString(16)}` }] });
      setChainId(targetChainId); setStep('connect'); setKeys(null); setTxHash(null);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const tn = targetChainId === 59144 ? NETWORKS.mainnet : NETWORKS.sepolia;
        try {
          await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [{
            chainId: `0x${targetChainId.toString(16)}`, chainName: tn.name, rpcUrls: [tn.rpcUrl],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, blockExplorerUrls: [tn.explorerUrl],
          }]});
          setChainId(targetChainId); setStep('connect'); setKeys(null); setTxHash(null);
        } catch (addError: any) {
          setError(addError.message || 'Failed to add network');
        }
      } else {
        setError(switchError.message || 'Failed to switch network');
      }
    }
  }, []);

  const generateKeys = useCallback(() => {
    const newKeys = generateRandomKeys();
    const stored: StoredKeys = {
      spendingPrivateKey: newKeys.spendingPrivateKey,
      viewingPrivateKey: newKeys.viewingPrivateKey,
      spendingPublicKey: newKeys.spendingPublicKey,
      viewingPublicKey: newKeys.viewingPublicKey,
      metaAddress: newKeys.metaAddress,
      timestamp: Date.now(), chainId,
    };
    storeKeys(stored);
    setKeys(stored); setError(null); setStep('preview');
  }, [chainId]);

  const registerOnChain = useCallback(async () => {
    if (!keys || !walletAddress) return;
    setIsRegistering(true); setError(null);
    try {
      if (typeof window === 'undefined' || !window.ethereum) throw new Error('No wallet');
      const registerData = encodeRegisterKeys(SCHEME_ID, keys.metaAddress);
      const tx = await window.ethereum.request({ method: 'eth_sendTransaction', params: [{
        from: walletAddress, to: network.registry, data: registerData,
      }]});
      setTxHash(tx as string); setStep('success');
    } catch (err: any) {
      setError(err.code === 4001 ? 'Transaction rejected' : (err.message || 'Registration failed'));
    } finally { setIsRegistering(false); }
  }, [keys, walletAddress, network]);

  const steps = [
    { id: 'connect', label: 'CONNECT', num: 1 },
    { id: 'generate', label: 'GENERATE', num: 2 },
    { id: 'preview', label: 'PREVIEW', num: 3 },
    { id: 'register', label: 'REGISTER', num: 4 },
    { id: 'success', label: 'COMPLETE', num: 5 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="relative min-h-screen">
      <div className="specular-field" />
      <div className="chrome-orb chrome-orb-1" />
      <div className="chrome-orb chrome-orb-2" />
      <ChromeNav />
      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-tertiary)]">ERC-6538 REGISTRY</span>
          <h1 className="mt-4 font-['Bebas_Neue'] text-5xl md:text-6xl tracking-[0.08em] text-[var(--text-primary)]">REGISTER STEALTH ADDRESS</h1>
          <p className="mt-4 font-['Sora'] text-sm font-light text-[var(--text-tertiary)] max-w-md mx-auto">One-time setup. Publishes your public keys so anyone can send you private payments.</p>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <button onClick={() => switchNetwork(59141)} className={`px-4 py-2 rounded-lg font-['Sora'] text-xs tracking-wider transition-all duration-300 ${chainId === 59141 ? 'bg-[var(--glass-highlight)] text-[var(--text-primary)] border border-[var(--glass-border)]' : 'text-[var(--text-dim)] hover:text-[var(--text-tertiary)] border border-transparent'}`}>TESTNET</button>
          <button onClick={() => switchNetwork(59144)} className={`px-4 py-2 rounded-lg font-['Sora'] text-xs tracking-wider transition-all duration-300 flex items-center gap-2 ${chainId === 59144 ? 'bg-[var(--glass-highlight)] text-[var(--text-primary)] border border-[var(--glass-border)]' : 'text-[var(--text-dim)] hover:text-[var(--text-tertiary)] border border-transparent'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${chainId === 59144 ? 'bg-emerald-400/60' : ''}`} />
            MAINNET
          </button>
        </div>

        <div className="flex items-center justify-between mb-16 px-4">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-['Sora'] text-xs font-medium transition-all duration-500 border ${i < currentStepIndex ? 'bg-[var(--text-primary)] text-[var(--bg-deep)] border-[var(--text-primary)]' : i === currentStepIndex ? 'border-[var(--glass-highlight)] text-[var(--text-secondary)]' : 'border-[var(--glass-border)] text-[var(--text-dim)]'}`}>
                  {i < currentStepIndex ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--bg-deep)" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg> : s.num}
                </div>
                <span className={`absolute -bottom-6 font-['Sora'] text-[8px] tracking-[0.15em] uppercase whitespace-nowrap ${i <= currentStepIndex ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-dim)]'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 mb-5 ${i < currentStepIndex ? 'bg-[var(--text-tertiary)]' : 'bg-[var(--glass-border)]'}`} />}
            </div>
          ))}
        </div>

        {error && <div className="mb-8 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]"><p className="font-['Sora'] text-xs text-red-400/80">{error}</p></div>}

        <GlassCard intensity={step === 'preview' ? 'bright' : 'default'}>
          <div className="p-8 md:p-12">
            {step === 'connect' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center border border-[var(--glass-border)]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><path d="M16 14h.01" /></svg>
                </div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-[var(--text-secondary)] mb-3">CONNECT YOUR WALLET</h3>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-8 max-w-sm mx-auto">We need your wallet to generate and register your stealth keypair on-chain.</p>
                <ChromeButton onClick={connectWallet}><span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>Connect Wallet</span></ChromeButton>
              </div>
            )}

            {step === 'generate' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center border border-[var(--glass-border)]">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                </div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-[var(--text-secondary)] mb-3">GENERATE STEALTH KEYS</h3>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-8 max-w-sm mx-auto">We'll generate a random spending keypair and viewing keypair. Your private keys are stored only in this browser's session.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ChromeButton onClick={generateKeys}><span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Generate Keys</span></ChromeButton>
                  <ChromeButton variant="secondary" onClick={() => setStep('connect')}>Back</ChromeButton>
                </div>
              </div>
            )}

            {step === 'preview' && keys && (
              <div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-[var(--text-secondary)] mb-8">YOUR STEALTH META-ADDRESS</h3>
                <div className="space-y-6 mb-8">
                  <KeyDisplay label="Stealth Meta-Address (Public)" value={keys.metaAddress} truncated={false} />
                  <div className="grid md:grid-cols-2 gap-6">
                    <KeyDisplay label="Spending Public Key" value={keys.spendingPublicKey} />
                    <KeyDisplay label="Viewing Public Key" value={keys.viewingPublicKey} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <KeyDisplay label="Spending Private Key (SECRET)" value={keys.spendingPrivateKey} truncated={false} />
                    <KeyDisplay label="Viewing Private Key (SECRET)" value={keys.viewingPrivateKey} truncated={false} />
                  </div>
                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02]">
                    <div className="flex items-start gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,180,0,0.6)" strokeWidth="1.5" className="mt-0.5 shrink-0"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <div>
                        <p className="font-['Sora'] text-[10px] font-medium uppercase tracking-wider text-amber-400/60 mb-1">Save Your Private Keys</p>
                        <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] leading-relaxed">Your private keys are stored in this browser session only. If you close this tab, you will lose access to your stealth payments. Copy them now.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <ChromeButton onClick={() => setStep('register')}><span className="flex items-center gap-2">Continue to Register<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></ChromeButton>
                  <ChromeButton variant="secondary" onClick={generateKeys}>Regenerate</ChromeButton>
                </div>
              </div>
            )}

            {step === 'register' && keys && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center border border-[var(--glass-border)]">
                  {isRegistering ? <svg width="32" height="32" viewBox="0 0 24 24" className="animate-spin"><circle cx="12" cy="12" r="10" stroke="var(--text-dim)" strokeWidth="1.5" fill="none" /><path d="M12 2a10 10 0 0110 10" stroke="var(--text-secondary)" strokeWidth="1.5" fill="none" /></svg> : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5"><path d="M9 12l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>}
                </div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-[var(--text-secondary)] mb-3">{isRegistering ? 'REGISTERING ON-CHAIN' : 'CONFIRM REGISTRATION'}</h3>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-8 max-w-sm mx-auto">{isRegistering ? 'Please confirm the transaction in your wallet.' : `This will publish your stealth meta-address to the ERC-6538 registry on ${network.name}.`}</p>
                {!isRegistering && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <ChromeButton onClick={registerOnChain}><span className="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4" /><rect x="3" y="3" width="18" height="18" rx="2" /></svg>Confirm & Register</span></ChromeButton>
                    <ChromeButton variant="secondary" onClick={() => setStep('preview')}>Back</ChromeButton>
                  </div>
                )}
              </div>
            )}

            {step === 'success' && keys && (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)', boxShadow: '0 0 40px rgba(255,255,255,0.15)' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="font-['Bebas_Neue'] text-2xl tracking-[0.1em] text-[var(--text-secondary)] mb-3">REGISTRATION COMPLETE</h3>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-8 max-w-sm mx-auto">Your stealth meta-address is now public on {network.name}. Anyone can use it to send you private USDC payments.</p>
                <div className="space-y-4 mb-8">
                  <KeyDisplay label="Your Stealth Meta-Address" value={keys.metaAddress} truncated={false} />
                </div>
                {txHash && (
                  <div className="mb-8">
                    <a href={`${network.explorerUrl}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-['DM_Mono'] text-xs tracking-wider text-[var(--text-dim)] hover:text-[var(--text-secondary)] transition-colors duration-300 border-b border-[var(--glass-border)] hover:border-[var(--glass-highlight)] pb-0.5">
                      View transaction on Explorer<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" /><polyline points="15,3 21,3 21,9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    </a>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <a href="/send"><ChromeButton><span className="flex items-center gap-2">Send Private Payment<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg></span></ChromeButton></a>
                  <ChromeButton variant="secondary" onClick={() => { navigator.clipboard.writeText(keys.metaAddress); }}>Copy Meta-Address</ChromeButton>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
