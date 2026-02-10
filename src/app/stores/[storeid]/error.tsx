'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function StoreDetailError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Store detail error:', error);
  }, [error]);

  return (
    <Box minH="100vh" bg="white" py={20}>
      <Container maxW="lg">
        <VStack gap={6} textAlign="center">
          <Text fontSize="6xl">🏪</Text>
          <Heading size="xl" color="black">
            حدث خطأ أثناء تحميل المتجر
          </Heading>
          <Text color="gray.600" maxW="md">
            نعتذر عن هذا الخطأ. يرجى المحاولة مرة أخرى أو تصفح المتاجر الأخرى.
          </Text>
          {error.digest && (
            <Text fontSize="xs" color="gray.400">
              Error ID: {error.digest}
            </Text>
          )}
          <VStack gap={3}>
            <Button
              bg="black"
              color="white"
              _hover={{ bg: 'gray.800' }}
              onClick={reset}
              size="lg"
            >
              إعادة المحاولة
            </Button>
            <Link href="/sellers">
              <Button
                variant="outline"
                borderColor="black"
                borderWidth={2}
                color="black"
                _hover={{ bg: 'gray.50' }}
                size="lg"
              >
                تصفح المتاجر
              </Button>
            </Link>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}
