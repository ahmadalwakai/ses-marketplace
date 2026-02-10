import {
  Box,
  Container,
  SimpleGrid,
  Skeleton,
  VStack,
  HStack,
} from '@chakra-ui/react';

export default function StoreDetailLoading() {
  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Store Header skeleton */}
          <Box
            borderWidth={2}
            borderColor="black"
            borderRadius="xl"
            p={8}
            boxShadow="4px 4px 0 0 black"
          >
            <VStack gap={4}>
              <Skeleton height="40px" width="250px" />
              <Skeleton height="24px" width="120px" borderRadius="full" />
              <Skeleton height="20px" width="150px" />
              <Skeleton height="60px" width="400px" maxW="100%" />
              <HStack gap={8}>
                <VStack>
                  <Skeleton height="32px" width="60px" />
                  <Skeleton height="16px" width="80px" />
                </VStack>
                <VStack>
                  <Skeleton height="32px" width="40px" />
                  <Skeleton height="16px" width="50px" />
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Products section */}
          <Box>
            <Skeleton height="32px" width="150px" mb={6} />
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Box
                  key={i}
                  borderWidth={2}
                  borderColor="gray.200"
                  borderRadius="xl"
                  p={4}
                >
                  <VStack align="stretch" gap={3}>
                    <Skeleton height="180px" borderRadius="lg" />
                    <Skeleton height="20px" width="80%" />
                    <Skeleton height="16px" width="60%" />
                    <HStack justify="space-between">
                      <Skeleton height="24px" width="80px" />
                      <Skeleton height="16px" width="60px" />
                    </HStack>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
