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

