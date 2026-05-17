# StealthPay — Materials

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- viem (transaction encoding, event parsing, crypto)
- @scopelift/stealth-address-sdk (stealth crypto)

### Smart Contracts
- Hardhat
- ERC-5564 Announcer (CREATE2 deployed on all EVM chains, no deploy needed)
- ERC-6538 StealthMetaAddressRegistry (CREATE2 deployed on all EVM chains, no deploy needed)

### Chain
- Linea Sepolia testnet (chainId: 59141) — development
- Linea mainnet (chainId: 59144) — production

### Deployment
- Vercel (frontend)

## Key Dependencies
| Package | Purpose |
|---------|---------|
| next | React framework |
| viem | Ethereum client library, ABI encoding, event parsing |
| @scopelift/stealth-address-sdk | ECDH stealth address generation |
| hardhat | Smart contract development |
| @nomicfoundation/hardhat-toolbox | Hardhat plugins |
| dotenv | Environment variable loading |

## Contract Addresses
| Contract | Linea Sepolia | Linea Mainnet |
|----------|--------------|---------------|
| ERC-5564 Announcer | `0x55649E01B5Df198D18D95b5cc5051630cfD45564` | `0x55649E01B5Df198D18D95b5cc5051630cfD45564` |
| ERC-6538 Registry | `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538` | `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538` |
| USDC | `0xA219439258ca9da29E9Cc4cE5596924745e12B93` | `0x176211869cA2b568f2A7D4EE941E073a821EE1ff` |

## Contract Sources
- ERC-5564 Announcer: https://eips.ethereum.org/EIPS/eip-5564
- ERC-6538 Registry: https://eips.ethereum.org/EIPS/eip-6538

## Reference Links
- Linea docs: https://docs.linea.build
- Linea Sepolia faucet: https://docs.linea.build/build-on-linea/use-linea-testnet/fund
- Linea Sepolia explorer: https://sepolia.lineascan.build
- Linea mainnet explorer: https://lineascan.build
- @scopelift/stealth-address-sdk npm: https://www.npmjs.com/package/@scopelift/stealth-address-sdk
- eth-stealth-addresses Rust crate: https://crates.io/crates/eth-stealth-addresses

## File Structure
```
Stealthpay/
├── agent.md                  # Agent memory — critical rules & decisions
├── solutions.md              # Issues encountered and how they were fixed
├── milestones.md             # Build progress tracker
├── materials.md              # Tech stack, dependencies, references
├── .env
├── .env.example
├── hardhat.config.ts
├── contracts/
│   ├── ERC5564Announcer.sol
│   └── ERC6538Registry.sol
├── deploy/
│   └── deploy.ts
├── scripts/
│   └── test-stealth.ts       # Round-trip crypto test
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── layout.tsx            # Root layout + providers
│   │   ├── globals.css           # Theme CSS variables
│   │   ├── register/page.tsx     # Meta-address registration
│   │   ├── send/page.tsx         # Send USDC privately
│   │   ├── inbox/page.tsx        # Receive dashboard
│   │   └── pay/[address]/page.tsx# Shareable payment links
│   ├── lib/
│   │   ├── stealth.ts            # Stealth crypto helpers
│   │   ├── constants.ts          # Network configs, ABIs, viem encode functions
│   │   └── storage.ts            # sessionStorage persistence
│   ├── abi/
│   │   ├── ERC5564Announcer.json
│   │   └── ERC6538Registry.json
│   ├── components/
│   │   ├── ChromeNav.tsx         # Sticky nav + theme switcher
│   │   ├── ChromeButton.tsx      # Chrome gradient button
│   │   ├── GlassCard.tsx         # Theme-aware glass panel
│   │   ├── KeyDisplay.tsx        # Hex address display
│   │   └── ThemeSwitcher.tsx     # Dark/dim/light toggle
│   └── providers/
│       ├── wagmi.tsx             # Wallet config (Sepolia + Mainnet)
│       └── ThemeProvider.tsx     # Theme context + persistence
└── package.json
```
