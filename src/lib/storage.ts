import type { Hex } from 'viem';

export interface StoredKeys {
  spendingPrivateKey: Hex;
  viewingPrivateKey: Hex;
  spendingPublicKey: Hex;
  viewingPublicKey: Hex;
  metaAddress: Hex;
  timestamp: number;
  chainId: number;
}

const STORAGE_KEY = 'stealthpay-keys';

export function storeKeys(keys: StoredKeys) {
  if (typeof window === 'undefined') return;
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keys)); } catch {}
}

export function loadStoredKeys(chainId: number): StoredKeys | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredKeys;
    return parsed.chainId === chainId ? parsed : null;
  } catch { return null; }
}

export function clearStoredKeys() {
  if (typeof window === 'undefined') return;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
}
