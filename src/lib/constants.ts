export const ADDRESSES = {
  lineaSepolia: {
    announcer: process.env.NEXT_PUBLIC_ANNOUNCER_ADDRESS || "0x55649E01B5Df198D18D95b5cc5051630cfD45564",
    registry: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS || "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538",
    usdc: process.env.NEXT_PUBLIC_USDC_ADDRESS || "",
  },
  lineaMainnet: {
    announcer: "0x55649E01B5Df198D18D95b5cc5051630cfD45564",
    registry: "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538",
    usdc: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
  },
} as const;

export const SCHEME_ID = 1n;

export const BLOCK_SCAN_LIMIT = 10_000;
