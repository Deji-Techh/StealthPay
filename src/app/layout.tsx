import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title: "StealthPay — Private USDC Payments on Linea",
  description: "Send USDC privately using stealth addresses. Nobody on-chain can link the payment to the recipient's real wallet. ERC-5564 + ERC-6538 on Linea.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
