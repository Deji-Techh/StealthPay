# StealthPay — Milestones Tracker

## Phase 1 — Environment setup
- [x] Initialise Next.js 14 project with TypeScript + Tailwind
- [x] Install wagmi, viem, RainbowKit and configure for Linea Sepolia + Mainnet
- [x] Install Hardhat and configure Linea RPC endpoints
- [x] Set up .env with PRIVATE_KEY, LINEA_RPC_URL, and USDC addresses
- [x] Install @scopelift/stealth-address-sdk (replaces eth-stealth-addresses — that's a Rust crate, not npm)

## Phase 2 — Smart contracts
- [x] Copy ERC-6538 StealthMetaAddressRegistry.sol source into contracts/ folder
- [x] Copy ERC-5564 Announcer.sol source into contracts/ folder
- [x] Write Hardhat deploy script — deploys both contracts and logs addresses
- [ ] Run deploy to Linea Sepolia testnet — confirm both txs on Linea explorer (needs funded wallet)
- [x] Save deployed contract addresses to src/lib/constants.ts
- [x] Copy contract ABIs into frontend/abi/ — ERC6538.json and ERC5564.json

## Phase 3 — Stealth crypto layer
- [x] Write generateStealthAddress(recipientMetaAddress) helper
- [x] Write computeStealthPrivKey(ephemeralPubKey, viewTag, spendingKey) helper
- [x] Write scanAnnouncements(logs, spendKey) — filters announcer logs
- [x] Write generateRandomKeys() — returns full keypair + metaAddress
- [x] Unit test all helpers in isolation (scripts/test-stealth.ts)
- [ ] Confirm round-trip: generate → announce → scan → derive key → check balance (needs on-chain tx)

## Phase 4 — Register flow
- [x] Build /register page — wallet connect, generate stealth meta-address
- [x] Call ERC-6538 registerKeys() with generated meta-address on-chain
- [x] Show confirmation + display user's public stealth address for sharing
- [x] Persist stealth keypair securely in sessionStorage
- [x] 5-step wizard with progress indicator
- [x] Network switching with flow state reset

## Phase 5 — Send flow
- [x] Build /send page — input field for recipient address
- [x] Lookup recipient's meta-address from ERC-6538 registry
- [x] Call generateStealthAddress() → produce one-time stealth address
- [x] Call USDC.transfer(stealthAddress, amount)
- [x] Call Announcer.announce(ephemeralPubKey, stealthAddress, viewTag)
- [x] Show success state with Linea explorer link
- [x] Generate shareable payment link: /pay/[stealthMetaAddress]
- [x] Use viem encodeFunctionData — no manual hex encoding

## Phase 6 — Receive flow
- [x] Build /inbox page — fetch last 10,000 blocks of Announcer logs
- [x] Run scanAnnouncements() client-side against fetched logs
- [x] Display matched stealth addresses with USDC balance
- [x] Withdraw button — sign transfer from derived stealth private key
- [x] Handle gas requirement — show warning if stealth address has no ETH
- [x] Show empty state while scanning
- [x] Load stored keys from sessionStorage instead of generating random keys
- [x] Use correct ANNOUNCEMENT_EVENT_SIGNATURE and parseAnnouncementLog

## Phase 7 — UX polish
- [x] Mobile responsive layout — all pages work on 375px viewport
- [x] Theme switcher — 3 modes (dark, dim, light) persisted in localStorage
- [x] Network toggle on every page (TESTNET/MAINNET)
- [x] Chain switching via wallet_switchEthereumChain with fallback add
- [x] QR code for shareable payment link
- [x] Copy-to-clipboard for stealth meta-address and payment link
- [x] Landing page with 3-step explainer
- [x] Liquid mercury on obsidian design theme
- [x] GlassCard, ChromeButton, KeyDisplay, ChromeNav components

## Phase 8 — End-to-end testing
- [ ] Full send → scan → withdraw flow on Linea Sepolia with two wallets
- [ ] Verify on Linea explorer: USDC goes to stealth address, announcement emitted
- [ ] Verify third wallet cannot derive private key from public announcement data
- [ ] Test with MetaMask — confirm network switching works
- [ ] Test shareable /pay link — open in incognito, complete send without being registered
- [ ] Test mainnet flow with real USDC

## Phase 9 — Launch & demo
- [ ] Deploy frontend to Vercel — set NEXT_PUBLIC env vars
- [ ] Verify both testnet and mainnet work in production
- [ ] Write README: what it is, how to run, deployed URL, contract addresses
- [ ] Record 90-second demo video: register → share link → send → receive
- [ ] Prepare 2-minute pitch: problem → solution → live demo → Linea-first angle
