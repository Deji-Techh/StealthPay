import { http, createConfig } from "wagmi";
import { lineaSepolia, linea } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const config = getDefaultConfig({
  appName: "StealthPay",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "stealthpay-project",
  chains: [lineaSepolia, linea],
  transports: {
    [lineaSepolia.id]: http("https://rpc.sepolia.linea.build"),
    [linea.id]: http("https://rpc.linea.build"),
  },
  ssr: true,
});
