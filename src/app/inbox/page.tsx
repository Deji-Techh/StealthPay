'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChromeNav } from '@/components/ChromeNav';
import { GlassCard } from '@/components/GlassCard';
import { ChromeButton } from '@/components/ChromeButton';
import { KeyDisplay } from '@/components/KeyDisplay';
import { scanAnnouncements } from '@/lib/stealth';
import { NETWORKS, ANNOUNCEMENT_EVENT_SIGNATURE, BLOCK_SCAN_LIMIT, USDC_DECIMALS, parseAnnouncementLog } from '@/lib/constants';
import { loadStoredKeys, type StoredKeys } from '@/lib/storage';
import type { Hex, Address } from 'viem';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

type Payment = {
  stealthAddress: Address;
  sender: Address;
  amount: string;
  stealthPrivateKey: Hex;
  hasBalance: boolean;
  hasETH: boolean;
  txHash: string;
};

export default function InboxPage() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [chainId, setChainId] = useState<number>(59141);
  const [isScanning, setIsScanning] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasScanned, setHasScanned] = useState(false);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

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
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setWalletConnected(true);
      } else {
        setWalletConnected(false);
      }
    };

    if (window.ethereum) {
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
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
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
    }
  }, []);

  const [storedKeys, setStoredKeys] = useState<StoredKeys | null>(null);

  useEffect(() => {
    const keys = loadStoredKeys(chainId);
    setStoredKeys(keys);
  }, [chainId]);

  const scanChain = useCallback(async () => {
    if (!walletConnected || !storedKeys) return;
    setIsScanning(true);
    setScanning(true);
    setError(null);
    setPayments([]);

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected');
      }

      const blockNumberHex = await window.ethereum.request({
        method: 'eth_blockNumber',
      }) as string;
      const currentBlock = parseInt(blockNumberHex, 16);
      const fromBlock = currentBlock - BLOCK_SCAN_LIMIT;

      const logs = await window.ethereum.request({
        method: 'eth_getLogs',
        params: [{
          address: network.announcer,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: 'latest',
          topics: [ANNOUNCEMENT_EVENT_SIGNATURE],
        }],
      }) as any[];

      if (!logs || logs.length === 0) {
        setScanning(false);
        setIsScanning(false);
        setHasScanned(true);
        return;
      }

      const parsedAnnouncements = logs
        .filter((log: any) => log.topics && log.topics.length >= 4)
        .map((log: any) => parseAnnouncementLog({
          topics: log.topics,
          data: log.data,
          transactionHash: log.transactionHash,
        }));

      const matched = scanAnnouncements(
        parsedAnnouncements,
        storedKeys.viewingPrivateKey,
        storedKeys.spendingPublicKey,
        storedKeys.spendingPrivateKey,
      );

      const paymentsWithBalances: Payment[] = await Promise.all(
        matched.map(async (m) => {
          try {
            const balanceHex = await window.ethereum!.request({
              method: 'eth_call',
              params: [{
                to: network.usdc,
                data: `0x70a08231${m.stealthAddress.slice(2).padStart(64, '0')}`,
              }, 'latest'],
            });
            const balance = BigInt(balanceHex as string);
            const amount = (Number(balance) / 10 ** USDC_DECIMALS).toFixed(2);

            const ethBalanceHex = await window.ethereum!.request({
              method: 'eth_getBalance',
              params: [m.stealthAddress, 'latest'],
            });
            const ethBalance = BigInt(ethBalanceHex as string);

            return {
              stealthAddress: m.stealthAddress,
              sender: m.caller,
              amount,
              stealthPrivateKey: m.stealthPrivateKey,
              hasBalance: balance > BigInt(0),
              hasETH: ethBalance > BigInt(0),
              txHash: m.txHash || '',
            };
          } catch {
            return {
              stealthAddress: m.stealthAddress,
              sender: m.caller,
              amount: '0.00',
              stealthPrivateKey: m.stealthPrivateKey,
              hasBalance: false,
              hasETH: false,
              txHash: m.txHash || '',
            };
          }
        })
      );

      setPayments(paymentsWithBalances.filter((p) => p.hasBalance));
      setScanning(false);
      setIsScanning(false);
      setHasScanned(true);
    } catch (err: any) {
      setError(err.message || 'Failed to scan');
      setScanning(false);
      setIsScanning(false);
    }
  }, [walletConnected, network, storedKeys]);

  const withdraw = useCallback(async (payment: Payment) => {
    if (!walletAddress || !payment.hasETH) return;

    setWithdrawing(payment.stealthAddress);
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected');
      }

      // Transfer USDC from stealth address to user's wallet
      // Note: This requires importing the stealth private key into the wallet
      // For MVP, we show the key and instruct user to import it
      setWithdrawing(null);
    } catch (err: any) {
      setError(err.message || 'Withdrawal failed');
      setWithdrawing(null);
    }
  }, [walletAddress]);

  return (
    <div className="relative min-h-screen">
      <div className="specular-field opacity-[var(--specular-opacity)]" />
      <div className="chrome-orb chrome-orb-1" />
      <div className="chrome-orb chrome-orb-2" />

      <ChromeNav />

      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-32 pb-20">
        {/* Page header */}
        <div className="text-center mb-12">
          <span className="font-['Sora'] text-[10px] font-medium tracking-[0.3em] uppercase text-[var(--text-dim)]">
            INCOMING PAYMENTS
          </span>
          <h1 className="mt-4 font-['Bebas_Neue'] text-5xl md:text-6xl tracking-[0.08em] text-[var(--text-primary)]">
            INBOX
          </h1>
          <p className="mt-4 font-['Sora'] text-sm font-light text-[var(--text-tertiary)] max-w-md mx-auto">
            Scan the chain for stealth payments sent to you. Only you can find and withdraw them.
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

        {!walletConnected && (
          <GlassCard>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                CONNECT TO SCAN
              </h3>
              <ChromeButton onClick={connectWallet}>Connect Wallet</ChromeButton>
            </div>
          </GlassCard>
        )}

        {walletConnected && !storedKeys && (
          <GlassCard>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                NO KEYS REGISTERED
              </h3>
              <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-6 max-w-sm mx-auto">
                You need to register a stealth meta-address first before you can receive payments.
              </p>
              <a href="/register">
                <ChromeButton>Register Now</ChromeButton>
              </a>
            </div>
          </GlassCard>
        )}

        {walletConnected && storedKeys && (
          <div className="space-y-6">
            {/* Scan button */}
            <GlassCard intensity="bright">
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                  {isScanning ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" className="animate-spin">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" fill="none" />
                      <path d="M12 2a10 10 0 0110 10" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                  )}
                </div>
                <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                  {isScanning ? 'SCANNING CHAIN' : 'SCAN FOR PAYMENTS'}
                </h3>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-6 max-w-sm mx-auto">
                  {isScanning
                    ? `Checking last ${BLOCK_SCAN_LIMIT.toLocaleString()} blocks on ${network.name}...`
                    : `Search the last ${BLOCK_SCAN_LIMIT.toLocaleString()} blocks for stealth payments sent to you on ${network.name}.`}
                </p>
                <ChromeButton onClick={scanChain} disabled={isScanning}>
                  {isScanning ? (
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" className="animate-spin">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                      Scanning...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                      </svg>
                      Scan Now
                    </span>
                  )}
                </ChromeButton>
              </div>
            </GlassCard>

            {/* Error */}
            {error && (
              <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
                <p className="font-['Sora'] text-xs text-red-400/80">{error}</p>
              </div>
            )}

            {/* Empty state */}
            {hasScanned && !scanning && payments.length === 0 && (
              <GlassCard>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/[0.06]">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="17,8 12,3 7,8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-tertiary)] mb-2">
                    NO PAYMENTS FOUND
                  </h3>
                  <p className="font-['Sora'] text-xs font-light text-[var(--text-dim)] max-w-sm mx-auto">
                    No stealth payments found in the last {BLOCK_SCAN_LIMIT.toLocaleString()} blocks on {network.name}.
                    Share your stealth meta-address to start receiving private payments.
                  </p>
                </div>
              </GlassCard>
            )}

            {/* Payments */}
            {payments.map((payment) => (
              <GlassCard key={payment.stealthAddress} intensity="bright">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="font-['Bebas_Neue'] text-3xl tracking-[0.05em] text-[var(--text-primary)]">
                        {payment.amount}
                      </span>
                      <span className="font-['Sora'] text-xs text-[var(--text-tertiary)] ml-2">USDC</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!payment.hasETH && (
                        <span className="
                          px-2 py-1 rounded-md
                          font-['Sora'] text-[9px] font-medium uppercase tracking-wider
                          text-amber-400/70 bg-amber-500/[0.06] border border-amber-500/10
                        ">
                          No Gas
                        </span>
                      )}
                      {payment.hasETH && (
                        <span className="
                          px-2 py-1 rounded-md
                          font-['Sora'] text-[9px] font-medium uppercase tracking-wider
                          text-emerald-400/70 bg-emerald-500/[0.06] border border-emerald-500/10
                        ">
                          Ready
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <span className="font-['Sora'] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">From</span>
                      <span className="font-['DM_Mono'] text-xs text-white/50 truncate ml-4 max-w-[150px]">
                        {payment.sender.slice(0, 6)}...{payment.sender.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                      <span className="font-['Sora'] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">Stealth Address</span>
                      <span className="font-['DM_Mono'] text-xs text-white/50 truncate ml-4 max-w-[150px]">
                        {payment.stealthAddress.slice(0, 6)}...{payment.stealthAddress.slice(-4)}
                      </span>
                    </div>
                  </div>

                  <KeyDisplay label="Stealth Private Key" value={payment.stealthPrivateKey} truncated={false} />

                  {/* Gas warning */}
                  {!payment.hasETH && (
                    <div className="mt-4 p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02]">
                      <p className="font-['Sora'] text-[10px] font-medium uppercase tracking-wider text-amber-400/60 mb-1">
                        Needs ETH for Gas
                      </p>
                      <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] leading-relaxed">
                        This stealth address has no ETH. Send a small amount of {network.name === 'Linea' ? 'ETH' : 'SepoliaETH'} to this address first, then import the private key above to withdraw.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-4">
                    <ChromeButton
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(payment.stealthPrivateKey);
                      }}
                    >
                      Copy Private Key
                    </ChromeButton>
                    <a
                      href={`${network.explorerUrl}/tx/${payment.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ChromeButton variant="secondary">
                        View TX
                      </ChromeButton>
                    </a>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
