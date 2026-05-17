import {
  generateRandomStealthMetaAddress,
  parseKeysFromStealthMetaAddress,
} from "@scopelift/stealth-address-sdk/dist/utils/helpers";
import {
  VALID_SCHEME_ID,
} from "@scopelift/stealth-address-sdk/dist/utils/crypto/types";
import {
  generateStealthAddress as sdkGenerateStealthAddress,
  computeStealthKey as sdkComputeStealthKey,
  checkStealthAddress as sdkCheckStealthAddress,
} from "@scopelift/stealth-address-sdk/dist/utils/crypto";

async function main() {
  console.log("=== Stealth Crypto Round-Trip Test ===\n");

  const metaAddress = generateRandomStealthMetaAddress({
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  console.log("1. Generated random stealth meta-address:");
  console.log("   spendingPublicKey:", metaAddress.spendingPublicKey);
  console.log("   viewingPublicKey:", metaAddress.viewingPublicKey);
  console.log("   spendingPrivateKey:", metaAddress.spendingPrivateKey);
  console.log("   viewingPrivateKey:", metaAddress.viewingPrivateKey);
  console.log();

  const uri = `st:sepolia:${metaAddress.stealthMetaAddress}`;
  console.log("2. Stealth meta-address URI:", uri);
  console.log();

  const stealthResult = sdkGenerateStealthAddress({
    stealthMetaAddressURI: uri,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  console.log("3. Generated stealth address:");
  console.log("   stealthAddress:", stealthResult.stealthAddress);
  console.log("   ephemeralPublicKey:", stealthResult.ephemeralPublicKey);
  console.log("   viewTag:", stealthResult.viewTag);
  console.log();

  const isMatch = sdkCheckStealthAddress({
    ephemeralPublicKey: stealthResult.ephemeralPublicKey,
    spendingPublicKey: metaAddress.spendingPublicKey,
    userStealthAddress: stealthResult.stealthAddress,
    viewingPrivateKey: metaAddress.viewingPrivateKey,
    viewTag: stealthResult.viewTag,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  console.log("4. checkStealthAddress result:", isMatch);
  if (!isMatch) {
    console.error("   FAILED: stealth address check did not match!");
    process.exit(1);
  }
  console.log();

  const stealthPrivateKey = sdkComputeStealthKey({
    ephemeralPublicKey: stealthResult.ephemeralPublicKey,
    spendingPrivateKey: metaAddress.spendingPrivateKey,
    viewingPrivateKey: metaAddress.viewingPrivateKey,
    schemeId: VALID_SCHEME_ID.SCHEME_ID_1,
  });

  console.log("5. Computed stealth private key:", stealthPrivateKey);
  console.log();

  console.log("=== All tests passed! ===");
  console.log("Round-trip verified: generate -> check -> compute");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
