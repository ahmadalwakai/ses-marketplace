'use client';

import { Box, Spinner, VStack, Text } from '@chakra-ui/react';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message = 'جاري التحميل...', fullScreen = false }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <Box
        position="fixed"
        inset={0}
        bg="white"
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={4}>
          <Spinner size="xl" color="black" />
          <Text color="gray.600">{message}</Text>
        </VStack>
      </Box>
    );
  }

  return (
    <VStack py={10} gap={4}>
      <Spinner size="xl" color="black" />
      <Text color="gray.600">{message}</Text>
    </VStack>
  );
}

// Skeleton loader for product cards
export function ProductCardSkeleton() {
  return (
    <Box
      className="neon-card"
      p={4}
      animation="pulse 2s infinite"
    >
      <VStack align="stretch" gap={3}>
        <Box h="200px" bg="gray.200" borderRadius="lg" />
        <Box h="20px" bg="gray.200" borderRadius="md" w="60%" />
        <Box h="16px" bg="gray.200" borderRadius="md" w="80%" />
        <Box h="16px" bg="gray.200" borderRadius="md" w="40%" />
      </VStack>
    </Box>
  );
}

// Skeleton for list items
export function ListItemSkeleton() {
  return (
    <Box
      className="neon-card"
      p={4}
      animation="pulse 2s infinite"
    >
      <Box display="flex" gap={4}>
        <Box w="60px" h="60px" bg="gray.200" borderRadius="lg" />
        <VStack align="start" flex={1} gap={2}>
          <Box h="20px" bg="gray.200" borderRadius="md" w="60%" />
          <Box h="16px" bg="gray.200" borderRadius="md" w="80%" />
        </VStack>
      </Box>
    </Box>
  );
}
