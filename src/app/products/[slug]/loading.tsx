import {
  Box,
  Container,
  SimpleGrid,
  Skeleton,
  VStack,
  HStack,
} from '@chakra-ui/react';

export default function ProductDetailLoading() {
  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={10}>
          {/* Image skeleton */}
          <VStack align="stretch" gap={4}>
            <Skeleton height="400px" borderRadius="xl" />
            <HStack gap={2} justify="center">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} width="80px" height="80px" borderRadius="lg" />
              ))}
            </HStack>
          </VStack>

          {/* Details skeleton */}
          <VStack align="stretch" gap={6}>
            <VStack align="stretch" gap={3}>
              <HStack>
                <Skeleton height="24px" width="80px" borderRadius="md" />
                <Skeleton height="24px" width="60px" borderRadius="md" />
              </HStack>
              <Skeleton height="40px" width="80%" />
              <Skeleton height="20px" width="50%" />
            </VStack>

            <Skeleton height="24px" width="120px" />
            <Skeleton height="48px" width="200px" />
            
            <VStack align="stretch" gap={2}>
              <Skeleton height="16px" width="100%" />
              <Skeleton height="16px" width="90%" />
              <Skeleton height="16px" width="95%" />
            </VStack>

            <Skeleton height="20px" width="100px" />

            <VStack gap={3} align="stretch">
              <HStack>
                <Skeleton height="20px" width="60px" />
                <HStack>
                  <Skeleton height="32px" width="32px" />
                  <Skeleton height="32px" width="40px" />
                  <Skeleton height="32px" width="32px" />
                </HStack>
              </HStack>
              <Skeleton height="48px" width="100%" borderRadius="md" />
              <Skeleton height="48px" width="100%" borderRadius="md" />
              <HStack gap={3}>
                <Skeleton height="40px" flex={1} borderRadius="md" />
                <Skeleton height="40px" flex={1} borderRadius="md" />
              </HStack>
            </VStack>
          </VStack>
        </SimpleGrid>

        {/* Reviews skeleton */}
        <Box mt={16}>
          <Skeleton height="32px" width="200px" mb={6} />
          <VStack gap={4} align="stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height="100px" borderRadius="lg" />
            ))}
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
