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


