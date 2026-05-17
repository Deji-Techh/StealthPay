# StealthPay — Solutions Log

Record of what broke and how it was fixed.

---

## 2026-05-17 npm install fails with E404 for @qvac packages
**Problem:** Parent monorepo (`fundtracer`) has missing dependency `@qvac/decoder-audio@^0.1.0` and `@qvac/util-transcription@^0.1.0`, causing all npm installs to fail.
**Fix:** Created a temporary isolated directory `/tmp/stealthpay-standalone`, installed all packages there, then copied `node_modules` into `Stealthpay/`. The parent's `workspaces` config was pulling Stealthpay into the workspace resolution.
**Root cause:** Parent `package.json` has `"workspaces": ["packages/*"]` which interferes with npm dependency resolution in subdirectories.

## 2026-05-17 eth-stealth-addresses not found on npm
**Problem:** `npm install eth-stealth-addresses` returns 404 — package doesn't exist on npm registry.
**Fix:** `eth-stealth-addresses` is a **Rust crate** (crates.io), not an npm package. The TypeScript equivalent is `@scopelift/stealth-address-sdk` — installed that instead.
**Root cause:** The plan referenced `eth-stealth-addresses` as an npm package, but it's only published to crates.io (Rust).

## 2026-05-17 ERC-5564/6538 contracts already deployed on all EVM chains
**Problem:** Original plan assumed we need to deploy both contracts ourselves to Linea Sepolia.
**Fix:** Both contracts are deployed at deterministic CREATE2 addresses on ALL EVM chains (including Linea Sepolia). We can use them directly without deploying:
- ERC-5564 Announcer: `0x55649E01B5Df198D18D95b5cc5051630cfD45564`
- ERC-6538 Registry: `0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538`
**Root cause:** ScopeLift deployed these via CREATE2 using a deterministic deployer. No custom deployment needed for Phase 2.

## 2026-05-17 @scopelift/stealth-address-sdk has heavy transitive dependencies (graphql)
**Problem:** SDK depends on `graphql-request` which requires `graphql` — npm install keeps timing out, preventing full dependency tree installation. Running `tsx` test scripts fails with "Cannot find module 'graphql'".
**Fix:**
1. Downloaded `graphql` tarball directly via `npm pack` from Chinese mirror (npmmirror.com)
2. Imported crypto functions directly from SDK sub-paths (`dist/utils/crypto`, `dist/utils/helpers`) to avoid loading the subgraph client which pulls in graphql
3. Round-trip test passes: generate → check → compute all verified
**Root cause:** The SDK bundles a subgraph-based announcement scanner (graphql) even when you only need the crypto functions. Direct sub-path imports bypass this.

## 2026-05-17 Manual hex encoding causes transaction failures
**Problem:** send/pay pages used manual hex string concatenation for ABI encoding (`0xa9059cbb...` for transfer, `0x0b44babf...` for announce). Prone to offset calculation errors, wrong padding, bytes length bugs.
**Fix:** Replaced all manual encoding with viem's `encodeFunctionData()` — type-safe, ABI-aware, handles dynamic bytes offsets correctly. Added `encodeUSDCTransfer()`, `encodeAnnounce()`, `encodeRegisterKeys()` to `src/lib/constants.ts`.
**Root cause:** ABI encoding for dynamic types (bytes) requires careful offset tables in calldata. Manual construction is fragile.

## 2026-05-17 Inbox page never finds real payments
**Problem:** Inbox generated random stealth keys on every load for scanning — it was never checking the user's actual registered keys, so it could never match real announcements.
**Fix:**
1. Inbox now loads stored keys from `sessionStorage` via `loadStoredKeys(chainId)`
2. Added "no keys registered" state directing users to /register first
3. Fixed event topic hash — was hardcoded wrong value, now uses `ANNOUNCEMENT_EVENT_SIGNATURE` computed via `keccak256(toBytes('Announcement(uint256,address,address,bytes,bytes)'))`
4. Fixed log parsing — replaced manual slice arithmetic with `parseAnnouncementLog()` that properly handles ABI-encoded dynamic bytes
**Root cause:** Keys were never persisted across sessions, and the event topic/parsing were wrong.

## 2026-05-17 SDK API mismatches block build
**Problem:** `stealth.ts` imported `HexString` from main SDK export (doesn't exist there), called `generateKeysFromSignature({ signature })` (takes string, not object), `generateRandomStealthMetaAddress({ schemeId })` (takes no args), `generateStealthMetaAddressFromKeys({ ...schemeId })` (no schemeId param).
**Fix:** Updated all SDK calls to match actual API signatures. Import `HexString` from `dist/utils/crypto/types`.
**Root cause:** SDK documentation/examples may be outdated; always check `.d.ts` files for actual signatures.

## 2026-05-17 Network switching doesn't work on register page
**Problem:** `switchNetwork()` relied on the `chainChanged` event listener to update state, but the wallet returns before emitting the event, so the UI never reflected the switch. Also no error feedback for user.
**Fix:** Added explicit `setChainId(targetChainId)` and state reset after successful switch. Added `setError()` for both switch and add chain failures. Added nested try/catch for `wallet_addEthereumChain`.
**Root cause:** Event listeners are not guaranteed to fire synchronously; UI state should be updated optimistically.

## 2026-05-17 Next.js type errors from page exports
**Problem:** Exporting functions (`storeKeys`, `loadStoredKeys`, `StoredKeys` type) from `src/app/register/page.tsx` caused Next.js type generation errors — it treats all page exports as route exports.
**Fix:** Extracted storage utilities to `src/lib/storage.ts`. Pages should only export the page component itself.
**Root cause:** Next.js type generator expects page files to export only route-level constructs (default export, metadata, generateStaticParams, etc.).
