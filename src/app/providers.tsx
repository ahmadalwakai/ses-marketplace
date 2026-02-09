'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ChakraProvider value={defaultSystem}>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ChakraProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
