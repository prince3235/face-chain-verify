// Standalone sanity check: submits one record and immediately re-fetches +
// re-verifies it, independent of the Python backend. Useful for confirming
// a fresh deployment works before wiring up the full pipeline.
//
// Usage: npx hardhat run scripts/verify_onchain.js --network polygonAmoy
const hre = require("hardhat");
const crypto = require("crypto");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error("Set CONTRACT_ADDRESS in .env before running this script.");
  }

  const contract = await hre.ethers.getContractAt("VerificationRegistry", contractAddress);

  const sampleContent = "https://example-social.test/post/demo123|Consented demo post";
  const hash = "0x" + crypto.createHash("sha256").update(sampleContent).digest("hex");

  console.log("Submitting record...");
  const tx = await contract.submitRecord(hash, "https://example-social.test/post/demo123");
  const receipt = await tx.wait();
  console.log(`Submitted in tx: ${receipt.hash}`);

  const recordId = (await contract.recordCount()) - 1n;
  console.log(`Fetching record #${recordId}...`);
  const record = await contract.getRecord(recordId);
  console.log("On-chain record:", {
    hash: record[0],
    metadataURI: record[1],
    timestamp: record[2].toString(),
    submitter: record[3],
  });

  const matchesOriginal = await contract.verifyRecord(recordId, hash);
  console.log(`Re-verification against original hash: ${matchesOriginal ? "MATCH ✅" : "MISMATCH ❌"}`);

  const tamperedHash = "0x" + crypto.createHash("sha256").update(sampleContent + "tampered").digest("hex");
  const matchesTampered = await contract.verifyRecord(recordId, tamperedHash);
  console.log(`Re-verification against tampered hash: ${matchesTampered ? "MATCH (unexpected!) ❌" : "MISMATCH (expected) ✅"}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
