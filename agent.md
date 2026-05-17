# StealthPay — Agent Memory

## Project Overview
Private USDC payments on Linea using stealth addresses (ERC-5564/ERC-6538).
Send USDC to anyone via their public stealth address. On-chain, the payment address is unlinked from the recipient's real wallet.

## Critical Rules
- **NEVER store user's private key in state or localStorage** — keep in memory only, derive fresh each scan
- **Scanning cap: last 10,000 blocks** for MVP — full scanning takes minutes
- **Recipient needs ETH to withdraw** — stealth address has no gas, warn users upfront
- **Never commit .env or private keys to git**

## Key Decisions
- Tech stack: Next.js 14 + Tailwind, Hardhat, wagmi/viem/RainbowKit, @scopelift/stealth-address-sdk
- Chain: Linea Sepolia (testnet, chainId 59141) → Linea mainnet at demo
- ERC-5564 Announcer + ERC-6538 Registry: deploy existing contracts, zero custom Solidity
- Stealth keypair persisted in sessionStorage (memory only, cleared on tab close)

## Contract Addresses (CREATE2 deterministic — same on all EVM chains)
- ERC-6538 Registry: `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`
- ERC-5564 Announcer: `0x55649E01B5Df198D18D95b5cc5051630cfD45564`
- USDC (Linea Sepolia): TBD — needs lookup
- USDC (Linea Mainnet): `0x176211869cA2b568f2A7D4EE941E073a821EE1ff`

## Environment Variables
- PRIVATE_KEY — deployer wallet private key
- LINEA_RPC_URL — Linea Sepolia RPC endpoint
- NEXT_PUBLIC_ANNOUNCER_ADDRESS — set after deploy
- NEXT_PUBLIC_REGISTRY_ADDRESS — set after deploy
- NEXT_PUBLIC_USDC_ADDRESS — set after deploy

## Shareable Payment Link Format
- `/pay/[stealthMetaAddress]` — pre-fills send form

## Pitch Angle
"Every USDC transfer on Linea today is fully public. StealthPay brings financial privacy to on-chain payments using finalized Ethereum standard ERC-5564, deployed on Linea for the first time."
