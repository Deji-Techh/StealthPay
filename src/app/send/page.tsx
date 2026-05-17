'use client';

import { useState, useCallback, useEffect } from 'react';
import { ChromeNav } from '@/components/ChromeNav';
import { GlassCard } from '@/components/GlassCard';
import { ChromeButton } from '@/components/ChromeButton';
import { KeyDisplay } from '@/components/KeyDisplay';
import { generateStealthAddressFromMeta } from '@/lib/stealth';
import { NETWORKS, ERC20_ABI, ANNOUNCER_ABI, USDC_DECIMALS, SCHEME_ID } from '@/lib/constants';
import type { Hex, Address } from 'viem';

type Step = 'input' | 'confirm' | 'sending' | 'success';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

export default function SendPage() {
  const [step, setStep] = useState<Step>('input');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [chainId, setChainId] = useState<number>(59141);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletConnected, setWalletConnected] = useState(false);

  // Derived state
  const [metaAddress, setMetaAddress] = useState<Hex | null>(null);
  const [stealthData, setStealthData] = useState<{
    stealthAddress: Address;
    ephemeralPublicKey: Hex;
    viewTag: Hex;
  } | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const network = NETWORKS[chainId === 59144 ? 'mainnet' : 'sepolia'];

  useEffect(() => {
    const checkWallet = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        }
      } catch {}
    };
    checkWallet();

    const handleChainChanged = (newChainId: string) => {
      setChainId(parseInt(newChainId, 16));
    };

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
      setError('No wallet detected. Please install MetaMask.');
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

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (typeof window === 'undefined' || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
      setChainId(targetChainId);
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        const targetNetwork = targetChainId === 59144 ? NETWORKS.mainnet : NETWORKS.sepolia;
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: targetNetwork.name,
            rpcUrls: [targetNetwork.rpcUrl],
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            blockExplorerUrls: [targetNetwork.explorerUrl],
          }],
        });
        setChainId(targetChainId);
      }
    }
  }, []);

  const lookupRecipient = useCallback(async () => {
    if (!recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected');
      }

      // Read from ERC-6538 registry
      const registryData = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: network.registry,
          data: encodeStealthMetaAddressLookup(recipientAddress as Address),
        }, 'latest'],
      });

      const result = registryData as string;
      if (!result || result === '0x' || result.length < 130) {
        setError('Recipient has not registered a stealth meta-address on this network.');
        return;
      }

      // Parse the bytes response
      const bytesLength = parseInt(result.slice(66 + 64, 66 + 128), 16);
      const metaAddressBytes = ('0x' + result.slice(66 + 128, 66 + 128 + bytesLength * 2)) as Hex;

      setMetaAddress(metaAddressBytes);

      // Generate stealth address
      const stealth = generateStealthAddressFromMeta(chainId, metaAddressBytes);
      setStealthData(stealth);
      setStep('confirm');
    } catch (err: any) {
      setError(err.message || 'Failed to lookup recipient');
    }
  }, [recipientAddress, amount, chainId, network]);

  const executeSend = useCallback(async () => {
    if (!stealthData || !walletAddress || !metaAddress) return;

    setStep('sending');
    setError(null);

    try {
      if (typeof window === 'undefined' || !window.ethereum) {
        throw new Error('No wallet detected');
      }

      const amountWei = BigInt(Math.round(parseFloat(amount) * 10 ** USDC_DECIMALS));

      // 1. Transfer USDC to stealth address
      const usdcTxHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: network.usdc,
          data: encodeERC20Transfer(stealthData.stealthAddress, amountWei),
        }],
      });

      // Wait a moment for the tx to be mined
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 2. Announce the stealth payment
      const announceTxHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: walletAddress,
          to: network.announcer,
          data: encodeAnnounce(SCHEME_ID, stealthData.stealthAddress, stealthData.ephemeralPublicKey, stealthData.viewTag),
        }],
      });

      setTxHash(announceTxHash as string);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
      setStep('confirm');
    }
  }, [stealthData, walletAddress, amount, network, metaAddress]);

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
            PRIVATE TRANSFER
          </span>
          <h1 className="mt-4 font-['Bebas_Neue'] text-5xl md:text-6xl tracking-[0.08em] text-[var(--text-primary)]">
            SEND USDC
          </h1>
          <p className="mt-4 font-['Sora'] text-sm font-light text-[var(--text-tertiary)] max-w-md mx-auto">
            Enter the recipient's address. We'll generate a one-time stealth wallet that only they can access.
          </p>
        </div>

        {/* Network selector */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => switchNetwork(59141)}
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
            onClick={() => switchNetwork(59144)}
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

        {/* Wallet not connected */}
        {!walletConnected && (
          <GlassCard>
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-xl flex items-center justify-center border border-white/10">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                  <rect x="2" y="6" width="20" height="14" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </div>
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)] mb-2">
                CONNECT WALLET TO SEND
              </h3>
              <ChromeButton onClick={connectWallet}>Connect Wallet</ChromeButton>
            </div>
          </GlassCard>
        )}

        {/* Error */}
        {error && walletConnected && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/[0.03]">
            <p className="font-['Sora'] text-xs text-red-400/80">{error}</p>
          </div>
        )}

        {/* Step: Input */}
        {walletConnected && step === 'input' && (
          <GlassCard intensity="bright">
            <div className="p-8 space-y-6">
              {/* Recipient */}
              <div>
                <label className="block font-['Sora'] text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--text-tertiary)] mb-2">
                  RECIPIENT ADDRESS
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="0x..."
                  className="
                    w-full px-4 py-3 rounded-xl
                    font-['DM_Mono'] text-sm tracking-wide
                    text-[var(--text-primary)] placeholder:text-[var(--text-dim)]
                    bg-white/[0.03] border border-white/[0.06]
                    focus:border-white/20 focus:outline-none
                    transition-colors duration-300
                  "
                />
              </div>

              {/* Amount */}
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

              {/* Network info */}
              <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <span className="font-['Sora'] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                  NETWORK
                </span>
                <span className="font-['DM_Mono'] text-xs text-white/50 flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${chainId === 59144 ? 'bg-emerald-400/60' : 'bg-amber-400/60'}`} />
                  {network.name}
                </span>
              </div>

              <ChromeButton onClick={lookupRecipient}>
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

        {/* Step: Confirm */}
        {walletConnected && step === 'confirm' && stealthData && (
          <GlassCard intensity="bright">
            <div className="p-8 space-y-6">
              <h3 className="font-['Bebas_Neue'] text-xl tracking-[0.1em] text-[var(--text-secondary)]">
                CONFIRM PRIVATE TRANSFER
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/[0.04]">
                  <span className="font-['Sora'] text-xs text-[var(--text-tertiary)]">To</span>
                  <span className="font-['DM_Mono'] text-xs text-[var(--text-secondary)] truncate ml-4 max-w-[200px]">
                    {stealthData.stealthAddress}
                  </span>
                </div>
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

              {/* Warning */}
              <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02]">
                <p className="font-['Sora'] text-[10px] font-medium uppercase tracking-wider text-amber-400/60 mb-1">
                  Two Transactions
                </p>
                <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] leading-relaxed">
                  This will execute two transactions: USDC transfer + announcement. You'll need to approve both in your wallet.
                </p>
              </div>

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

        {/* Step: Sending */}
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
                SENDING TRANSACTION
              </h3>
              <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)]">
                Please approve both transactions in your wallet...
              </p>
            </div>
          </GlassCard>
        )}

        {/* Step: Success */}
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
                PAYMENT SENT PRIVATELY
              </h3>
              <p className="font-['Sora'] text-xs font-light text-[var(--text-tertiary)] mb-6 max-w-sm mx-auto">
                {amount} USDC has been sent to a one-time stealth address. Only the recipient can access these funds.
              </p>

              <div className="space-y-4 mb-6">
                <KeyDisplay label="Stealth Address" value={stealthData.stealthAddress} />
                <KeyDisplay label="Amount" value={`${amount} USDC`} truncated={false} />
              </div>

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
                  View on {network.name === 'Linea' ? 'LineaScan' : 'Sepolia LineaScan'}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15,3 21,3 21,9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <ChromeButton onClick={() => {
                  setStep('input');
                  setRecipientAddress('');
                  setAmount('');
                  setStealthData(null);
                  setMetaAddress(null);
                  setTxHash(null);
                }}>
                  Send Another
                </ChromeButton>
                <a href="/inbox">
                  <ChromeButton variant="secondary">Go to Inbox</ChromeButton>
                </a>
              </div>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}

function encodeStealthMetaAddressLookup(address: Address): string {
  const funcSelector = '3e2e5b12'; // stealthMetaAddress(address,uint256)
  const paddedAddress = address.slice(2).padStart(64, '0');
  const schemeId = '0000000000000000000000000000000000000000000000000000000000000001';
  return `0x${funcSelector}${paddedAddress}${schemeId}`;
}

function encodeERC20Transfer(to: Address, amount: bigint): string {
  const funcSelector = 'a9059cbb'; // transfer(address,uint256)
  const paddedAddress = to.slice(2).padStart(64, '0');
  const paddedAmount = amount.toString(16).padStart(64, '0');
  return `0x${funcSelector}${paddedAddress}${paddedAmount}`;
}

function encodeAnnounce(
  schemeId: number,
  stealthAddress: Address,
  ephemeralPubKey: Hex,
  viewTag: Hex
): string {
  const funcSelector = '0b44babf'; // announce(uint256,address,bytes,bytes)

  const paddedSchemeId = schemeId.toString(16).padStart(64, '0');

  const stealthAddrPadded = stealthAddress.slice(2).padStart(64, '0');

  const ephemeralOffset = 3 * 32 + 32;
  const ephemeralKeyBytes = ephemeralPubKey.slice(2);
  const ephemeralLength = (ephemeralKeyBytes.length / 2).toString(16).padStart(64, '0');
  const ephemeralPadded = ephemeralKeyBytes.padEnd(Math.ceil(ephemeralKeyBytes.length / 64) * 64, '0');

  const metadataOffset = ephemeralOffset + 1 + Math.ceil(ephemeralKeyBytes.length / 32) * 32;
  const metadataBytes = viewTag.slice(2);
  const metadataLength = (metadataBytes.length / 2).toString(16).padStart(64, '0');
  const metadataPadded = metadataBytes.padEnd(64, '0');

  return `0x${funcSelector}${paddedSchemeId}${stealthAddrPadded}${ephemeralOffset.toString(16).padStart(64, '0')}${metadataOffset.toString(16).padStart(64, '0')}${ephemeralLength}${ephemeralPadded}${metadataLength}${metadataPadded}`;
}
