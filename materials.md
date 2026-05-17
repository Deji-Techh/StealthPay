# StealthPay — Materials

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- wagmi + viem + RainbowKit (wallet connection)
- @scopelift/stealth-address-sdk (stealth crypto)

### Smart Contracts
- Hardhat
- ERC-5564 Announcer (CREATE2 deployed on all EVM chains, no deploy needed)
- ERC-6538 StealthMetaAddressRegistry (CREATE2 deployed on all EVM chains, no deploy needed)

### Chain
- Linea Sepolia testnet (chainId: 59141)
- Linea mainnet (chainId: 59144) — for demo/launch

### Deployment
- Vercel (frontend)

## Key Dependencies
| Package | Purpose |
|---------|---------|
| next | React framework |
| wagmi | React hooks for Ethereum |
| viem | Ethereum client library |
| @rainbow-me/rainbowkit | Wallet connection UI |
| hardhat | Smart contract development |
| @nomicfoundation/hardhat-toolbox | Hardhat plugins |
| @scopelift/stealth-address-sdk | ECDH stealth address generation |
| dotenv | Environment variable loading |

## Contract Sources
- ERC-5564 Announcer: https://eips.ethereum.org/EIPS/eip-5564
- ERC-6538 Registry: https://eips.ethereum.org/EIPS/eip-6538

## Reference Links
- Linea docs: https://docs.linea.build
- Linea Sepolia faucet: https://docs.linea.build/build-on-linea/use-linea-testnet/fund
- Linea Sepolia explorer: https://sepolia.lineascan.build
- @scopelift/stealth-address-sdk npm: https://www.npmjs.com/package/@scopelift/stealth-address-sdk
- eth-stealth-addresses Rust crate: https://crates.io/crates/eth-stealth-addresses

## File Structure (planned)
```
Stealthpay/
├── agent.md
├── solutions.md
├── milestones.md
├── materials.md
├── .env
├── .env.example
├── hardhat.config.ts
├── contracts/
│   ├── ERC5564Announcer.sol
│   └── ERC6538Registry.sol
├── deploy/
│   └── deploy.ts
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── register/
│   │   ├── send/
│   │   ├── inbox/
│   │   ├── pay/[address]/
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── stealth.ts            # crypto helpers
│   │   ├── contracts.ts          # contract interactions
│   │   └── constants.ts
│   ├── abi/
│   │   ├── ERC5564.json
│   │   └── ERC6538.json
│   ├── components/
│   └── providers/
└── package.json
```
