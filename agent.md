# StealthPay — Agent Memory

## Project Overview
Private USDC payments on Linea using stealth addresses (ERC-5564/ERC-6538).
Send USDC to anyone via their public stealth address. On-chain, the payment address is unlinked from the recipient's real wallet.

## Critical Rules
- **NEVER store private keys in localStorage** — use sessionStorage only, cleared on tab close
- **Scanning cap: last 10,000 blocks** for MVP — full scanning takes minutes
- **Recipient needs ETH to withdraw** — stealth address has no gas, warn users upfront
- **Never commit .env or private keys to git**

## Key Decisions
- Tech stack: Next.js 14 + Tailwind, Hardhat, wagmi/viem/RainbowKit, @scopelift/stealth-address-sdk
- Chain: Both Linea Sepolia (testnet, chainId 59141) and Linea Mainnet (chainId 59144)
- ERC-5564 Announcer + ERC-6538 Registry: CREATE2 deterministic addresses, no custom deploy needed
- Stealth keypair persisted in sessionStorage (cleared on tab close)
- All transaction encoding uses viem `encodeFunctionData` — no manual hex encoding
- Theme: 3-mode (dark/dim/light), liquid mercury on obsidian aesthetic

## Contract Addresses (CREATE2 deterministic — same on all EVM chains)
- ERC-6538 Registry: `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`
- ERC-5564 Announcer: `0x55649E01B5Df198D18D95b5cc5051630cfD45564`
- USDC (Linea Sepolia): `0xA219439258ca9da29E9Cc4cE5596924745e12B93`
- USDC (Linea Mainnet): `0x176211869cA2b568f2A7D4EE941E073a821EE1ff`

## Environment Variables
- PRIVATE_KEY — deployer wallet private key
- LINEA_RPC_URL — Linea RPC endpoint
- LINEA_SEPOLIA_RPC_URL — https://rpc.sepolia.linea.build
- LINEA_MAINNET_RPC_URL — https://rpc.linea.build
- NEXT_PUBLIC_ANNOUNCER_ADDRESS — `0x55649E01B5Df198D18D95b5cc5051630cfD45564`
- NEXT_PUBLIC_REGISTRY_ADDRESS — `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`

## Storage Key (sessionStorage)
- `stealthpay-keys` — stores { spendingPrivateKey, viewingPrivateKey, spendingPublicKey, viewingPublicKey, metaAddress, timestamp, chainId }

## Shareable Payment Link Format
- `/pay/[stealthMetaAddress]` — pre-fills send form with recipient's meta-address

## Network Switching
- All pages have TESTNET/MAINNET toggle
- Uses `wallet_switchEthereumChain` with `wallet_addEthereumChain` fallback
- Chain change listener resets flow state on register page
- `setChainId` called explicitly after successful switch

## Pitch Angle
"Every USDC transfer on Linea today is fully public. StealthPay brings financial privacy to on-chain payments using finalized Ethereum standard ERC-5564, deployed on Linea for the first time."
