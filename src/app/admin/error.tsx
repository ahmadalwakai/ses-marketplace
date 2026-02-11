'use client';

import { Box, VStack, Heading, Text, Button } from '@chakra-ui/react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minH="60vh">
      <VStack gap={4}>
        <Text fontSize="4xl">⚠️</Text>
        <Heading size="md">حدث خطأ</Heading>
        <Text color="gray.500" textAlign="center">
          {error.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'}
        </Text>
        <Button colorScheme="blue" onClick={reset}>
          إعادة المحاولة
        </Button>
      </VStack>
    </Box>
  );
}
