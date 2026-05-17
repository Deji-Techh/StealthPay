# StealthPay — Milestones Tracker

## Phase 1 — Environment setup
- [x] Initialise Next.js 14 project with TypeScript + Tailwind
- [x] Install wagmi, viem, RainbowKit and configure for Linea Sepolia (chainId 59141)
- [x] Install Hardhat and configure Linea Sepolia RPC + deployer wallet
- [x] Set up .env with PRIVATE_KEY, LINEA_RPC_URL, and USDC contract address
- [x] Install @scopelift/stealth-address-sdk (replaces eth-stealth-addresses — that's a Rust crate, not npm)

## Phase 2 — Smart contracts
- [x] Copy ERC-6538 StealthMetaAddressRegistry.sol source into contracts/ folder
- [x] Copy ERC-5564 Announcer.sol source into contracts/ folder
- [x] Write Hardhat deploy script — deploys both contracts and logs addresses
- [ ] Run deploy to Linea Sepolia testnet — confirm both txs on Linea explorer (needs funded wallet)
- [x] Save deployed contract addresses to constants/addresses.ts in frontend
- [x] Copy contract ABIs into frontend/abi/ — ERC6538.json and ERC5564.json

## Phase 3 — Stealth crypto layer
- [x] Write generateStealthAddress(recipientMetaAddress) helper
- [x] Write computeStealthPrivKey(ephemeralPubKey, viewTag, spendingKey) helper
- [x] Write scanAnnouncements(logs, spendKey) — filters announcer logs
- [x] Unit test all 3 helpers in isolation
- [ ] Confirm round-trip: generate → announce → scan → derive key → check balance (needs on-chain tx)

## Phase 4 — Register flow
- [ ] Build /register page — wallet connect, generate stealth meta-address
- [ ] Call ERC-6538 registerKeys() with generated meta-address on-chain
- [ ] Show confirmation + display user's public stealth address for sharing
- [ ] Persist stealth keypair securely in sessionStorage

## Phase 5 — Send flow
- [ ] Build /send page — input field for recipient address or ENS name
- [ ] Lookup recipient's meta-address from ERC-6538 registry
- [ ] Call generateStealthAddress() → produce one-time stealth address
- [ ] Call USDC.transfer(stealthAddress, amount)
- [ ] Call Announcer.announce(ephemeralPubKey, stealthAddress, viewTag)
- [ ] Show success state with Linea explorer link
- [ ] Generate shareable payment link: /pay/[stealthMetaAddress]

## Phase 6 — Receive flow
- [ ] Build /inbox page — fetch last 10,000 blocks of Announcer logs
- [ ] Run scanAnnouncements() client-side against fetched logs
- [ ] Display matched stealth addresses with USDC balance
- [ ] Withdraw button — sign transfer from derived stealth private key
- [ ] Handle gas requirement — show warning if stealth address has no ETH
- [ ] Show empty state and loading skeleton while scanning

## Phase 7 — UX polish
- [ ] Mobile responsive layout — all pages work on 375px viewport
- [ ] Toast notifications for tx pending, success, and error states
- [ ] QR code display for shareable payment link
- [ ] Copy-to-clipboard for stealth meta-address and payment link
- [ ] Landing page with 3-step explainer

## Phase 8 — End-to-end testing
- [ ] Full send → scan → withdraw flow on Linea Sepolia with two wallets
- [ ] Verify on Linea explorer: USDC goes to stealth address, announcement emitted
- [ ] Verify third wallet cannot derive private key from public announcement data
- [ ] Test with MetaMask — confirm RainbowKit works
- [ ] Test shareable /pay link — open in incognito, complete send without being registered

## Phase 9 — Launch & demo
- [ ] Deploy frontend to Vercel — set NEXT_PUBLIC env vars
- [ ] Switch RPC to Linea mainnet if budget allows — test one real USDC transfer
- [ ] Write README: what it is, how to run, deployed URL, contract addresses
- [ ] Record 90-second demo video: register → share link → send → receive
- [ ] Prepare 2-minute pitch: problem → solution → live demo → Linea-first angle
