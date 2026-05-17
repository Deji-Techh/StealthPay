# StealthPay

Private USDC payments on Linea using stealth addresses (ERC-5564/ERC-6538).

Send USDC to anyone using their public stealth address. Nobody on-chain — not even the sender — can link the payment to the recipient's real wallet.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![Built on Linea](https://img.shields.io/badge/Built%20on-Linea-617FFF)](https://linea.build/)

## The Problem

Every USDC transfer on Linea today is fully public. Your employer, your landlord, anyone can see what you paid and to whom. Financial privacy that's normal in cash and banking doesn't exist on-chain.

## The Solution

StealthPay brings privacy to on-chain payments using **ERC-5564** (Stealth Addresses), a finalized Ethereum standard deployed here on Linea.

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
- [x] Send USDC to any registered address — app auto-generates one-time address + publishes announcement
- [x] Recipient dashboard — scan announcements, see incoming funds, withdraw with one click
- [x] Shareable payment link — pre-filled send form
- [ ] ENS / Linea Name Service lookup
- [ ] Encrypted memo field
- [ ] Gasless relayer for withdrawals

## Tech Stack

### Frontend
- **Next.js 14** (App Router) with TypeScript
- **Tailwind CSS** for styling
- **wagmi + viem + RainbowKit** for wallet connection
- **@scopelift/stealth-address-sdk** for ECDH stealth address cryptography

### Smart Contracts
- **Hardhat** for development and deployment
- **ERC-5564 Announcer** — singleton event emitter (existing contract)
- **ERC-6538 Registry** — meta-address storage (existing contract)
- Zero custom Solidity — we deploy existing audited contracts

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
LINEASCAN_API_KEY=your_lineascan_api_key
NEXT_PUBLIC_ANNOUNCER_ADDRESS=0x...  # set after deploy
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...  # set after deploy
NEXT_PUBLIC_USDC_ADDRESS=0x...      # Linea Sepolia USDC address
```

### Deploy Contracts

```bash
npx hardhat run deploy/deploy.ts --network lineaSepolia
```

Save the output contract addresses to `.env` and `src/lib/constants.ts`.

### Run Frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
Stealthpay/
├── agent.md              # Agent memory — critical rules & decisions
├── solutions.md          # Issues encountered and how they were fixed
├── milestones.md         # Build progress tracker (9 phases, 48 tasks)
├── materials.md          # Tech stack, dependencies, references
├── .env.example          # Environment variable template
├── hardhat.config.ts     # Hardhat config — Linea Sepolia + Etherscan
├── package.json
├── contracts/            # Solidity sources
│   ├── ERC5564Announcer.sol
│   └── ERC6538Registry.sol
├── deploy/               # Deployment scripts
│   └── deploy.ts
└── src/
    ├── app/              # Next.js App Router pages
    │   ├── page.tsx      # Landing
    │   ├── register/     # Meta-address registration
    │   ├── send/         # Send USDC privately
    │   ├── inbox/        # Receive dashboard + withdraw
    │   └── pay/[address]/# Shareable payment links
    ├── lib/
    │   ├── stealth.ts    # Stealth crypto helpers
    │   └── contracts.ts  # Contract interaction utilities
    ├── abi/              # Contract ABIs
    └── providers/        # Wallet providers (wagmi + RainbowKit)
```

## Security Considerations

- **Never persist private keys** — the scanning step needs the private key momentarily; it's kept only in memory, derived fresh each scan, never stored in localStorage or state
- **Block scan cap** — scanning all logs is slow; MVP caps to last 10,000 blocks
- **Gas requirement** — the one-time stealth address has no ETH for gas. Recipients need a small amount of Linea ETH to withdraw. The gasless relayer (stretch goal) solves this.

## Contract Addresses

| Contract | Network | Address |
|----------|---------|---------|
| ERC-5564 Announcer | Linea Sepolia | *TBD after deployment* |
| ERC-6538 Registry | Linea Sepolia | *TBD after deployment* |
| USDC | Linea Sepolia | *TBD* |

The ERC-5564 Announcer singleton is also deployed at the deterministic address `0x55649E01B5Df198D18D95b5cc5051630cfD45564` via CREATE2 on all EVM chains — check if it exists on your target network before redeploying.

## Build Progress

| Phase | Status | Tasks |
|-------|--------|-------|
| 1. Environment setup | ✅ Complete | 5/5 |
| 2. Smart contracts | 🔄 In progress | 0/6 |
| 3. Stealth crypto layer | ⏳ Pending | 0/5 |
| 4. Register flow | ⏳ Pending | 0/4 |
| 5. Send flow | ⏳ Pending | 0/7 |
| 6. Receive flow | ⏳ Pending | 0/6 |
| 7. UX polish | ⏳ Pending | 0/5 |
| 8. E2E testing | ⏳ Pending | 0/5 |
| 9. Launch & demo | ⏳ Pending | 0/5 |

## License

MIT — see [LICENSE](LICENSE) for details.

## Resources

- [ERC-5564: Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [ERC-6538: Stealth Meta-Address Registry](https://eips.ethereum.org/EIPS/eip-6538)
- [Linea Documentation](https://docs.linea.build)
- [@scopelift/stealth-address-sdk](https://www.npmjs.com/package/@scopelift/stealth-address-sdk)
- [Stealth.ereum — Ethereum tutorial](https://ethereum.org/en/developers/tutorials/stealth-addr/)
