import { ethers } from "hardhat";

const ANNOUNCER_DETERMINISTIC = "0x55649E01B5Df198D18D95b5cc5051630cfD45564";
const REGISTRY_DETERMINISTIC = "0x6538E6bf4B0eBd30A8Ea093027Ac2422ce5d6538";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("Deploying contracts to network:", network.name, "(chainId:", Number(network.chainId), ")");
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  const announcer = await ethers.getContractAt("ERC5564Announcer", ANNOUNCER_DETERMINISTIC);
  const registry = await ethers.getContractAt("ERC6538Registry", REGISTRY_DETERMINISTIC);

  try {
    await announcer.announce(0, deployer.address, "0x", "0x00");
    console.log("ERC5564Announcer already deployed at:", ANNOUNCER_DETERMINISTIC);
  } catch {
    console.log("ERC5564Announcer not found at deterministic address. Deploying...");
    const AnnouncerFactory = await ethers.getContractFactory("ERC5564Announcer");
    const announcerNew = await AnnouncerFactory.deploy();
    await announcerNew.waitForDeployment();
    const announcerAddr = await announcerNew.getAddress();
    console.log("ERC5564Announcer deployed at:", announcerAddr);
  }

  try {
    await registry.stealthMetaAddress(deployer.address, 1);
    console.log("ERC6538Registry already deployed at:", REGISTRY_DETERMINISTIC);
  } catch {
    console.log("ERC6538Registry not found at deterministic address. Deploying...");
    const RegistryFactory = await ethers.getContractFactory("ERC6538Registry");
    const registryNew = await RegistryFactory.deploy();
    await registryNew.waitForDeployment();
    const registryAddr = await registryNew.getAddress();
    console.log("ERC6538Registry deployed at:", registryAddr);
  }

  console.log("\nAdd these to your .env:");
  console.log("NEXT_PUBLIC_ANNOUNCER_ADDRESS=", ANNOUNCER_DETERMINISTIC);
  console.log("NEXT_PUBLIC_REGISTRY_ADDRESS=", REGISTRY_DETERMINISTIC);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
