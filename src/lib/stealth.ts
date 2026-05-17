import {
  generateStealthAddress as sdkGenerateStealthAddress,
  computeStealthKey as sdkComputeStealthKey,
  checkStealthAddress as sdkCheckStealthAddress,
  generateKeysFromSignature,
  generateStealthMetaAddressFromKeys,
  parseKeysFromStealthMetaAddress,
  ERC5564_CONTRACT_ADDRESS,
  type HexString,
} from "@scopelift/stealth-address-sdk";
import { VALID_SCHEME_ID } from "@scopelift/stealth-address-sdk/dist/utils/crypto/types";
import {
  type Hex,
  type Address,
  bytesToHex,
} from "viem";
import { ADDRESSES, SCHEME_ID } from "./constants";

export type StealthKeyPair = {
  spendingPrivateKey: Hex;
  viewingPrivateKey: Hex;
  spendingPublicKey: Hex;
  viewingPublicKey: Hex;
};

export type StealthMetaAddress = {
  metaAddressBytes: Hex;
  spendingPublicKey: Hex;
  viewingPublicKey: Hex;
};

export type GeneratedStealthAddress = {
  stealthAddress: Address;
  ephemeralPublicKey: Hex;
  viewTag: Hex;
};

export type AnnouncementLog = {
  schemeId: bigint;
  stealthAddress: Address;
  caller: Address;
  ephemeralPubKey: Hex;
  metadata: Hex;
};

export type MatchedAnnouncement = AnnouncementLog & {
  stealthPrivateKey: Hex;
};

const CHAIN_ID_MAP: Record<number, string> = {
  59141: "sepolia",
  59144: "linea",
};

export function buildStealthMetaAddressURI(
  chainId: number,
  metaAddressBytes: Hex
): string {
  const chain = CHAIN_ID_MAP[chainId] ?? String(chainId);
  return `st:${chain}:${metaAddressBytes}`;
}

export function deriveKeysFromSignature(
  signature: Hex
): StealthKeyPair {
  const keys = generateKeysFromSignature({ signature });
  return {
    spendingPrivateKey: keys.spendingPrivateKey as Hex,
    viewingPrivateKey: keys.viewingPrivateKey as Hex,
    spendingPublicKey: keys.spendingPublicKey as Hex,
    viewingPublicKey: keys.viewingPublicKey as Hex,
  };
}

export function createStealthMetaAddress(
  spendingPublicKey: Hex,
  viewingPublicKey: Hex
): StealthMetaAddress {
  const metaAddressBytes = generateStealthMetaAddressFromKeys({
    spendingPublicKey: spendingPublicKey as unknown as HexString,
    viewingPublicKey: viewingPublicKey as unknown as HexString,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  return {
    metaAddressBytes: metaAddressBytes as Hex,
    spendingPublicKey,
    viewingPublicKey,
  };
}

export function generateStealthAddress(
  chainId: number,
  stealthMetaAddress: Hex
): GeneratedStealthAddress {
  const uri = buildStealthMetaAddressURI(chainId, stealthMetaAddress);
  const result = sdkGenerateStealthAddress({
    stealthMetaAddressURI: uri,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  return {
    stealthAddress: result.stealthAddress as Address,
    ephemeralPublicKey: result.ephemeralPublicKey as Hex,
    viewTag: result.viewTag as Hex,
  };
}

export function computeStealthKey(
  ephemeralPublicKey: Hex,
  spendingPrivateKey: Hex,
  viewingPrivateKey: Hex
): Hex {
  const result = sdkComputeStealthKey({
    ephemeralPublicKey: ephemeralPublicKey as unknown as HexString,
    spendingPrivateKey: spendingPrivateKey as unknown as HexString,
    viewingPrivateKey: viewingPrivateKey as unknown as HexString,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  return result as Hex;
}

export function checkStealthAddress(params: {
  ephemeralPublicKey: Hex;
  spendingPublicKey: Hex;
  userStealthAddress: Address;
  viewingPrivateKey: Hex;
  viewTag: Hex;
}): boolean {
  return sdkCheckStealthAddress({
    ephemeralPublicKey: params.ephemeralPublicKey as unknown as HexString,
    spendingPublicKey: params.spendingPublicKey as unknown as HexString,
    userStealthAddress: params.userStealthAddress,
    viewingPrivateKey: params.viewingPrivateKey as unknown as HexString,
    viewTag: params.viewTag as unknown as HexString,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });
}

export function parseStealthMetaAddress(
  metaAddressBytes: Hex
): { spendingPublicKey: Hex; viewingPublicKey: Hex } {
  const parsed = parseKeysFromStealthMetaAddress({
    stealthMetaAddress: metaAddressBytes as unknown as HexString,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  return {
    spendingPublicKey: bytesToHex(parsed.spendingPublicKey),
    viewingPublicKey: bytesToHex(parsed.viewingPublicKey),
  };
}

export function scanAnnouncements(
  announcements: AnnouncementLog[],
  viewingPrivateKey: Hex,
  spendingPublicKey: Hex,
  spendingPrivateKey: Hex
): MatchedAnnouncement[] {
  const matched: MatchedAnnouncement[] = [];

  for (const announcement of announcements) {
    const viewTag = extractViewTag(announcement.metadata);
    const isMatch = sdkCheckStealthAddress({
      ephemeralPublicKey: announcement.ephemeralPubKey as unknown as HexString,
      spendingPublicKey: spendingPublicKey as unknown as HexString,
      userStealthAddress: announcement.stealthAddress,
      viewingPrivateKey: viewingPrivateKey as unknown as HexString,
      viewTag: viewTag as unknown as HexString,
      schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
    });

    if (isMatch) {
      const stealthPrivateKey = sdkComputeStealthKey({
        ephemeralPublicKey: announcement.ephemeralPubKey as unknown as HexString,
        spendingPrivateKey: spendingPrivateKey as unknown as HexString,
        viewingPrivateKey: viewingPrivateKey as unknown as HexString,
        schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
      });

      matched.push({
        ...announcement,
        stealthPrivateKey: stealthPrivateKey as Hex,
      });
    }
  }

  return matched;
}

function extractViewTag(metadata: Hex): Hex {
  return (metadata.slice(0, 4) as Hex) || "0x00";
}

export { VALID_SCHEME_ID, ERC5564_CONTRACT_ADDRESS };

export const ANNOUNCER_ADDRESS = ERC5564_CONTRACT_ADDRESS as Address;
export const REGISTRY_ADDRESS = ADDRESSES.lineaSepolia.registry as Address;
