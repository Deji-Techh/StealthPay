export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">StealthPay</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 text-center max-w-md">
        Private USDC payments on Linea. Send to anyone using their stealth address — nobody on-chain can link the payment to the recipient.
      </p>
    </main>
  );
}
