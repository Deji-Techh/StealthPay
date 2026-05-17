'use client';

import { http, createConfig } from 'wagmi';
import { lineaSepolia, linea } from 'wagmi/chains';
import { cookieStorage, createStorage } from 'wagmi';

export const config = createConfig({
  chains: [lineaSepolia, linea],
  transports: {
    [lineaSepolia.id]: http('https://rpc.sepolia.linea.build'),
    [linea.id]: http('https://rpc.linea.build'),
  },
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
});
