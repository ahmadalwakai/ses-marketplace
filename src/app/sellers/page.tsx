'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Input,
  Button,
  Badge,
  Spinner,
} from '@chakra-ui/react';

interface Seller {
  id: string;
  storeName: string;
  slug: string;
  bio: string | null;
  ratingAvg: number;
  ratingCount: number;
  verificationStatus: string;
  createdAt: string;
  _count: { products: number };
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchSellers();
  }, []);

  const fetchSellers = async () => {
    try {
      const res = await fetch('/api/stores?limit=50');
      const data = await res.json();
      if (data.success) {
        setSellers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sellers.filter((s) =>
    s.storeName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
            <Text color="gray.600">جارٍ تحميل المتاجر...</Text>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              🏬 دليل المتاجر
            </Heading>
            <Text color="gray.600" fontSize="lg">
              تصفح جميع المتاجر المعتمدة في سوريا للتسوق الإلكتروني
            </Text>
          </VStack>

          {/* Search */}
          <HStack maxW="lg" mx="auto" w="full">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث عن متجر..."
              size="lg"
              borderWidth={2}
              borderColor="black"
              _focus={{ boxShadow: '2px 2px 0 0 black' }}
            />
          </HStack>

          {/* Results count */}
          <Text color="gray.600" textAlign="center">
            {filtered.length} متجر
          </Text>

          {/* Sellers Grid */}
          {filtered.length === 0 ? (
            <VStack py={16} gap={4}>
              <Text fontSize="5xl">🏬</Text>
              <Heading size="md" color="gray.600">
                لا توجد متاجر حالياً
              </Heading>
              <Text color="gray.500">
                أول من يسجل كبائع سيظهر هنا
              </Text>
              <Link href="/auth/register">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                  سجّل كبائع
                </Button>
              </Link>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {filtered.map((seller) => (
                <Link key={seller.id} href={`/stores/${seller.slug}`}>
                  <Box
                    className="neon-card"
                    p={6}
                    borderRadius="xl"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-4px)' }}
                  >
                    <VStack align="stretch" gap={3}>
                      {/* Store avatar */}
                      <Box
                        w="60px"
                        h="60px"
                        bg="black"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        mx="auto"
                      >
                        <Text fontSize="2xl" color="white">
                          {seller.storeName.charAt(0)}
                        </Text>
                      </Box>

                      {/* Name & badge */}
                      <VStack gap={1} textAlign="center">
                        <Text fontWeight="bold" color="black" fontSize="lg">
                          {seller.storeName}
                        </Text>
                        {seller.verificationStatus === 'APPROVED' && (
                          <Badge colorPalette="green" fontSize="xs">
                            ✅ موثّق
                          </Badge>
                        )}
                      </VStack>

                      {/* Bio */}
                      {seller.bio && (
                        <Text fontSize="sm" color="gray.500" lineClamp={2} textAlign="center">
                          {seller.bio}
                        </Text>
                      )}

                      {/* Stats */}
                      <HStack justify="center" gap={4}>
                        <VStack gap={0}>
                          <Text fontWeight="bold" color="black" fontSize="sm">
                            {seller._count?.products ?? 0}
                          </Text>
                          <Text fontSize="xs" color="gray.500">منتج</Text>
                        </VStack>
                        <VStack gap={0}>
                          <Text fontWeight="bold" color="black" fontSize="sm">
                            ⭐ {seller.ratingAvg?.toFixed(1) ?? '0.0'}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            ({seller.ratingCount ?? 0})
                          </Text>
                        </VStack>
                      </HStack>

                      {/* CTA */}
                      <Button
                        size="sm"
                        variant="outline"
                        borderColor="black"
                        color="black"
                        w="full"
                      >
                        عرض المتجر
                      </Button>
                    </VStack>
                  </Box>
                </Link>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
