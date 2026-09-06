const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const VerificationRegistry = await hre.ethers.getContractFactory("VerificationRegistry");
  const contract = await VerificationRegistry.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`VerificationRegistry deployed to: ${address}`);
  console.log(`Network: ${hre.network.name}`);

  // Export the ABI to backend/contracts/VerificationRegistry.json so the
  // Python backend's ChainService can load it directly.
  const artifact = await hre.artifacts.readArtifact("VerificationRegistry");
  const backendContractsDir = path.join(__dirname, "..", "..", "backend", "contracts");
  fs.mkdirSync(backendContractsDir, { recursive: true });
  fs.writeFileSync(
    path.join(backendContractsDir, "VerificationRegistry.json"),
    JSON.stringify({ abi: artifact.abi, address, network: hre.network.name }, null, 2)
  );

  console.log(
    `ABI + address written to backend/contracts/VerificationRegistry.json — ` +
    `copy the address into backend/.env as CONTRACT_ADDRESS.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
