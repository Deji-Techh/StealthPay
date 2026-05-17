# StealthPay

Private USDC payments on Linea using stealth addresses (ERC-5564/ERC-6538).

Send USDC to anyone using their public stealth address. Nobody on-chain — not even the sender — can link the payment to the recipient's real wallet.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Built on Linea](https://img.shields.io/badge/Built%20on-Linea-617FFF)](https://linea.build/)

## The Problem

Every USDC transfer on Linea today is fully public. Your employer, your landlord, anyone can see what you paid and to whom. Financial privacy that's normal in cash and banking doesn't exist on-chain.

## The Solution

StealthPay brings privacy to on-chain payments using **ERC-5564** (Stealth Addresses), a finalized Ethereum standard deployed on Linea.

### How It Works

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Alice     │     │   ERC-6538       │     │   Stealth        │     │   Alice     │
│   registers │────>│   Registry       │────>│   Bob generates  │────>│   scans &   │
│   meta-addr │     │   (stores pub    │     │   one-time addr  │     │   withdraws │
│             │     │    key)          │     │   + USDC         │     │   privately │
└─────────────┘     └──────────────────┘     └──────────────────┘     └─────────────┘
```

1. **Register** — Alice publishes a stealth meta-address (public key) once. Anyone can see it.
2. **Send** — Bob looks up Alice's meta-address, generates a brand new one-time stealth address, sends USDC there, and publishes a tiny encrypted hint on-chain.
3. **Receive** — Alice scans the chain with her private key, finds the hint, and derives the private key to the one-time address — only she can do this.
4. **Withdraw** — Alice moves funds to her real wallet. On-chain, the payment address is unlinked from her identity.

The cryptography is ECDH key derivation — the same math behind end-to-end encrypted messaging.

## Features

- [x] Register stealth meta-address (one-time setup via ERC-6538 registry)
- [x] Stealth crypto layer — generate stealth addresses, derive private keys, scan announcements
- [x] Send USDC to any registered address — app auto-generates one-time address + publishes announcement
- [x] Recipient dashboard — scan announcements, see incoming funds, withdraw with one click
- [x] Shareable payment link — pre-filled send form
- [x] Network switching — Linea Sepolia (testnet) and Linea Mainnet (production)
- [x] 3-mode theme — dark, dim, light (liquid mercury aesthetic)
- [x] viem-based transaction encoding — type-safe, no manual hex
- [ ] ENS / Linea Name Service lookup
- [ ] Encrypted memo field
- [ ] Gasless relayer for withdrawals

## Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **viem** for transaction encoding, event parsing, and crypto utilities
- **@scopelift/stealth-address-sdk** for ECDH stealth address cryptography

### Smart Contracts
- **Hardhat** for development and deployment
- **ERC-5564 Announcer** — singleton event emitter (existing CREATE2 contract)
- **ERC-6538 Registry** — meta-address storage (existing CREATE2 contract)
- Zero custom Solidity — we use existing audited contracts

### Chain
- **Linea Sepolia** testnet (chainId: 59141) — development
- **Linea Mainnet** (chainId: 59144) — production

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- A wallet with Linea Sepolia ETH ([get testnet ETH](https://docs.linea.build/build-on-linea/use-linea-testnet/fund))

### Install

```bash
git clone https://github.com/Deji-Tech/StealthPay.git
cd StealthPay
npm install
```

### Configure

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
PRIVATE_KEY=your_deployer_wallet_private_key
LINEA_RPC_URL=https://rpc.sepolia.linea.build
```

### Run Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
Stealthpay/
├── agent.md                  # Agent memory — critical rules & decisions
├── solutions.md              # Issues encountered and how they were fixed
├── milestones.md             # Build progress tracker
├── materials.md              # Tech stack, dependencies, references
├── .env.example              # Environment variable template
├── hardhat.config.ts         # Hardhat config — Linea networks
├── package.json
├── contracts/                # Solidity sources
│   ├── ERC5564Announcer.sol
│   └── ERC6538Registry.sol
├── deploy/                   # Deployment scripts
│   └── deploy.ts
└── src/
    ├── app/                  # Next.js App Router pages
    │   ├── page.tsx          # Landing
    │   ├── register/         # Meta-address registration
    │   ├── send/             # Send USDC privately
    │   ├── inbox/            # Receive dashboard + withdraw
    │   └── pay/[address]/    # Shareable payment links
    ├── lib/
    │   ├── stealth.ts        # Stealth crypto helpers
    │   ├── constants.ts      # Network configs, ABIs, viem encode functions
    │   └── storage.ts        # sessionStorage persistence
    ├── abi/                  # Contract ABIs
    └── providers/            # Wallet + theme providers
```

## Security Considerations

- **Private keys stored in sessionStorage only** — cleared on tab close, never in localStorage
- **Block scan cap** — scanning all logs is slow; MVP caps to last 10,000 blocks
- **Gas requirement** — the one-time stealth address has no ETH for gas. Recipients need a small amount of Linea ETH to withdraw. The gasless relayer (stretch goal) solves this.

## Contract Addresses

| Contract | Linea Sepolia | Linea Mainnet |
|----------|--------------|---------------|
| ERC-5564 Announcer | `0x55649E01B5Df198D18D95b5cc5051630cfD45564` | `0x55649E01B5Df198D18D95b5cc5051630cfD45564` |
| ERC-6538 Registry | `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538` | `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538` |
| USDC | `0xA219439258ca9da29E9Cc4cE5596924745e12B93` | `0x176211869cA2b568f2A7D4EE941E073a821EE1ff` |

Both the Announcer and Registry are deployed via CREATE2 at deterministic addresses on all EVM chains — no custom deployment needed.

## Build Progress

| Phase | Status |
|-------|--------|
| 1. Environment setup | ✅ Complete |
| 2. Smart contracts | ✅ Complete (sources + ABIs) |
| 3. Stealth crypto layer | ✅ Complete (round-trip test passes) |
| 4. Register flow | ✅ Complete (5-step wizard + sessionStorage) |
| 5. Send flow | ✅ Complete (viem encoding) |
| 6. Receive flow | ✅ Complete (stored key scanning) |
| 7. UX polish | ✅ Complete (theme switcher, network toggle, responsive) |
| 8. E2E testing | ⏳ Pending |
| 9. Launch & demo | ⏳ Pending |

## License

MIT — see [LICENSE](LICENSE) for details.

## Resources

- [ERC-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [ERC-6538: Stealth Meta-Address Registry](https://eips.ethereum.org/EIPS/eip-6538)
- [Linea Documentation](https://docs.linea.build)
- [@scopelift/stealth-address-sdk](https://www.npmjs.com/package/@scopelift/stealth-address-sdk)
- [Stealth.ethereum.org — Tutorial](https://ethereum.org/en/developers/tutorials/stealth-addr/)
