'use client';

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { SessionProvider } from 'next-auth/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { ColorModeProvider } from '@/theme';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ChakraProvider value={defaultSystem}>
          <ColorModeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ColorModeProvider>
        </ChakraProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
