import { keccak256, toBytes, encodeEventTopics, encodeFunctionData, parseAbiItem, formatUnits } from 'viem';
import type { Hex, Address } from 'viem';

export type NetworkConfig = {
  name: string;
  chainId: number;
  announcer: `0x${string}`;
  registry: `0x${string}`;
  usdc: `0x${string}`;
  explorerUrl: string;
  rpcUrl: string;
};

export const NETWORKS = {
  sepolia: {
    name: "Linea Sepolia",
    chainId: 59141,
    announcer: "0x55649E01B5Df198D18D95b5cc5051630cfD45564",
    registry: "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538",
    usdc: "0xA219439258ca9da29E9Cc4cE5596924745e12B93",
    explorerUrl: "https://sepolia.lineascan.build",
    rpcUrl: "https://rpc.sepolia.linea.build",
  },
  mainnet: {
    name: "Linea",
    chainId: 59144,
    announcer: "0x55649E01B5Df198D18D95b5cc5051630cfD45564",
    registry: "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538",
    usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    explorerUrl: "https://lineascan.build",
    rpcUrl: "https://rpc.linea.build",
  },
} as const satisfies Record<string, NetworkConfig>;

export const SCHEME_ID = 1;
export const BLOCK_SCAN_LIMIT = 10_000;
export const USDC_DECIMALS = 6;

export const ANNOUNCEMENT_EVENT_SIGNATURE = keccak256(toBytes('Announcement(uint256,address,address,bytes,bytes)'));

export const ANNOUNCER_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "schemeId", type: "uint256" },
      { internalType: "address", name: "stealthAddress", type: "address" },
      { internalType: "bytes", name: "ephemeralPubKey", type: "bytes" },
      { internalType: "bytes", name: "metadata", type: "bytes" },
    ],
    name: "announce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "schemeId", type: "uint256" },
      { indexed: true, internalType: "address", name: "stealthAddress", type: "address" },
      { indexed: true, internalType: "address", name: "caller", type: "address" },
      { indexed: false, internalType: "bytes", name: "ephemeralPubKey", type: "bytes" },
      { indexed: false, internalType: "bytes", name: "metadata", type: "bytes" },
    ],
    name: "Announcement",
    type: "event",
  },
] as const;

export const REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "schemeId", type: "uint256" },
      { internalType: "bytes", name: "_stealthMetaAddress", type: "bytes" },
    ],
    name: "registerKeys",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "", type: "address" },
      { internalType: "uint256", name: "", type: "uint256" },
    ],
    name: "stealthMetaAddress",
    outputs: [{ internalType: "bytes", name: "", type: "bytes" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export const ERC20_ABI = [
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function encodeRegisterKeys(schemeId: number, metaAddress: Hex): Hex {
  return encodeFunctionData({
    abi: REGISTRY_ABI,
    functionName: 'registerKeys',
    args: [BigInt(schemeId), metaAddress],
  });
}

export function encodeUSDCTransfer(to: Address, amount: bigint): Hex {
  return encodeFunctionData({
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [to, amount],
  });
}

export function encodeAnnounce(
  schemeId: number,
  stealthAddress: Address,
  ephemeralPubKey: Hex,
  metadata: Hex
): Hex {
  return encodeFunctionData({
    abi: ANNOUNCER_ABI,
    functionName: 'announce',
    args: [BigInt(schemeId), stealthAddress, ephemeralPubKey, metadata],
  });
}

export function parseAnnouncementLog(log: {
  topics: Hex[];
  data: Hex;
  transactionHash: Hex;
}): {
  schemeId: bigint;
  stealthAddress: Address;
  caller: Address;
  ephemeralPubKey: Hex;
  metadata: Hex;
  txHash: Hex;
} {
  const schemeId = BigInt(log.topics[1]);

  const stealthAddressHex = log.topics[2].slice(-40);
  const stealthAddress = `0x${stealthAddressHex}` as Address;

  const callerHex = log.topics[3].slice(-40);
  const caller = `0x${callerHex}` as Address;

  // Parse dynamic bytes from data
  // data layout: 32 bytes (ephemeralPubKey offset), 32 bytes (metadata offset), then data
  const dataBytes = log.data.slice(2);
  const ephemeralOffset = parseInt(dataBytes.slice(0, 64), 16);
  const metadataOffset = parseInt(dataBytes.slice(64, 128), 16);

  // ephemeralPubKey at offset: first 32 bytes = length, rest = data
  const ephemeralLength = parseInt(dataBytes.slice(ephemeralOffset * 2, ephemeralOffset * 2 + 64), 16);
  const ephemeralPubKey = `0x${dataBytes.slice(ephemeralOffset * 2 + 64, ephemeralOffset * 2 + 64 + ephemeralLength * 2)}` as Hex;

  // metadata at offset
  const metadataLength = parseInt(dataBytes.slice(metadataOffset * 2, metadataOffset * 2 + 64), 16);
  const metadata = `0x${dataBytes.slice(metadataOffset * 2 + 64, metadataOffset * 2 + 64 + metadataLength * 2)}` as Hex;

  return {
    schemeId,
    stealthAddress,
    caller,
    ephemeralPubKey,
    metadata,
    txHash: log.transactionHash,
  };
}
