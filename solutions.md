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


