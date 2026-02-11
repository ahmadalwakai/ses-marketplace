'use client';

import { Box, VStack, HStack, SimpleGrid } from '@chakra-ui/react';

function Skeleton({ h = '20px', w = '100%' }: { h?: string; w?: string }) {
  return <Box bg="gray.200" borderRadius="md" h={h} w={w} animation="pulse 1.5s infinite" />;
}

export default function AdminLoading() {
  return (
    <VStack gap={6} align="stretch">
      <Skeleton h="32px" w="200px" />
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={4}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} bg="white" p={5} borderRadius="lg" borderWidth="1px">
            <Skeleton h="14px" w="80px" />
            <Skeleton h="28px" w="120px" />
          </Box>
        ))}
      </SimpleGrid>
      <Box bg="white" p={5} borderRadius="lg" borderWidth="1px">
        <HStack gap={4} mb={4}>
          <Skeleton h="14px" w="100px" />
          <Skeleton h="14px" w="100px" />
        </HStack>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} h="40px" w="100%" />
        ))}
      </Box>
    </VStack>
  );
}
