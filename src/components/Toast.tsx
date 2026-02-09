'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Box, VStack, HStack, Text, Button } from '@chakra-ui/react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info';
}

interface ToastContextValue {
  toast: (options: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

const statusStyles = {
  success: { bg: 'green.500', icon: '✓' },
  error: { bg: 'red.500', icon: '✕' },
  warning: { bg: 'yellow.500', icon: '⚠' },
  info: { bg: 'blue.500', icon: 'ℹ' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((options: Omit<Toast, 'id'>) => {
    const id = `toast-${++toastId}`;
    setToasts((prev) => [...prev, { ...options, id }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => addToast(options),
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, status: 'success' }),
    [addToast]
  );

  const error = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, status: 'error' }),
    [addToast]
  );

  const warning = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, status: 'warning' }),
    [addToast]
  );

  const info = useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, status: 'info' }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      
      {/* Toast container */}
      <Box
        position="fixed"
        bottom={4}
        left={4}
        zIndex={9999}
        maxW="400px"
      >
        <VStack gap={2} align="stretch">
          {toasts.map((t) => (
            <Box
              key={t.id}
              bg="white"
              borderWidth={2}
              borderColor="black"
              borderRadius="lg"
              boxShadow="4px 4px 0 0 black"
              overflow="hidden"
              animation="slideIn 0.3s ease-out"
            >
              <HStack gap={0}>
                <Box
                  bg={statusStyles[t.status].bg}
                  color="white"
                  px={3}
                  py={4}
                  fontSize="lg"
                  fontWeight="bold"
                >
                  {statusStyles[t.status].icon}
                </Box>
                <Box flex={1} p={3}>
                  <HStack justify="space-between" align="start">
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" color="black">
                        {t.title}
                      </Text>
                      {t.description && (
                        <Text fontSize="sm" color="gray.600">
                          {t.description}
                        </Text>
                      )}
                    </VStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => removeToast(t.id)}
                      p={0}
                      minW="auto"
                    >
                      ✕
                    </Button>
                  </HStack>
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>
      </Box>

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within ToastProvider');
  }
  return context;
}
