import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    lineaSepolia: {
      url: process.env.LINEA_RPC_URL || "https://rpc.sepolia.linea.build",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 59141,
    },
  },
  etherscan: {
    apiKey: {
      lineaSepolia: process.env.LINEASCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "lineaSepolia",
        chainId: 59141,
        urls: {
          browserURL: "https://sepolia.lineascan.build",
          apiURL: "https://api-sepolia.lineascan.build/api",
        },
      },
    ],
  },
};

export default config;
