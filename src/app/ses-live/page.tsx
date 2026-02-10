'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Badge,
  Spinner,
} from '@chakra-ui/react';

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  price: number;
  currency: string;
  condition: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  images: { url: string; alt?: string }[];
  seller: { storeName: string; slug: string };
  category: { name: string; nameAr?: string; slug: string } | null;
}

const conditionLabels: Record<string, string> = {
  NEW: '????',
  LIKE_NEW: '??? ????',
  GOOD: '???',
  FAIR: '?????',
  POOR: '??????',
};

type TabKey = 'trending' | 'newest' | 'top-rated';

export default function SESLivePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('trending');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const sortMap: Record<TabKey, string> = {
        trending: 'relevance',
        newest: 'newest',
        'top-rated': 'rating',
      };
      const res = await fetch(`/api/products?sort=${sortMap[tab]}&limit=12`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'trending', label: '?????? ??????', icon: '??' },
    { key: 'newest', label: '??? ??????', icon: '??' },
    { key: 'top-rated', label: '?????? ???????', icon: '?' },
  ];

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <HStack justify="center" gap={3}>
              <Text fontSize="3xl">??</Text>
              <Heading size="2xl" color="black">
                SES Live
              </Heading>
              <Badge colorPalette="red" fontSize="sm" p={1} px={2} borderRadius="full">
                ?????
              </Badge>
            </HStack>
            <Text color="gray.600" fontSize="lg">
              ???? ???????? ??????? ???? ?? ????? ?????? ??????????
            </Text>
          </VStack>

          {/* Tabs */}
          <HStack justify="center" gap={2} flexWrap="wrap">
            {tabs.map((t) => (
              <Button
                key={t.key}
                size="md"
                bg={tab === t.key ? 'black' : 'white'}
                color={tab === t.key ? 'white' : 'black'}
                borderWidth={2}
                borderColor="black"
                _hover={{ bg: tab === t.key ? 'gray.800' : 'gray.100' }}
                onClick={() => setTab(t.key)}
              >
                {t.icon} {t.label}
              </Button>
            ))}
          </HStack>

          {/* Products */}
          {loading ? (
            <VStack py={16}>
              <Spinner size="xl" color="black" />
              <Text color="gray.500">???? ???????...</Text>
            </VStack>
          ) : products.length === 0 ? (
            <VStack py={16} gap={4}>
              <Text fontSize="5xl">??</Text>
              <Heading size="md" color="gray.600">
                ?? ???? ?????? ??????
              </Heading>
              <Link href="/products">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                  ???? ?? ????????
                </Button>
              </Link>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {products.map((product, index) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Box
                    className="neon-card"
                    borderRadius="xl"
                    overflow="hidden"
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-4px)' }}
                    position="relative"
                  >
                    {/* Rank badge for top 3 */}
                    {tab === 'trending' && index < 3 && (
                      <Box
                        position="absolute"
                        top={2}
                        right={2}
                        bg={index === 0 ? 'red.500' : index === 1 ? 'orange.400' : 'yellow.400'}
                        color="white"
                        fontWeight="bold"
                        fontSize="sm"
                        w="28px"
                        h="28px"
                        borderRadius="full"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        zIndex={2}
                      >
                        {index + 1}
                      </Box>
                    )}

                    {/* Image */}
                    <Box h="200px" bg="gray.100" overflow="hidden">
                      {product.images[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.titleAr || product.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <VStack h="full" justify="center">
                          <Text fontSize="4xl">??</Text>
                        </VStack>
                      )}
                    </Box>

                    {/* Info */}
                    <VStack p={4} align="stretch" gap={2}>
                      <Text fontWeight="bold" color="black" lineClamp={2}>
                        {product.titleAr || product.title}
                      </Text>

                      <HStack justify="space-between" flexWrap="wrap">
                        <Text fontWeight="bold" color="black" fontSize="lg">
                          {Number(product.price).toLocaleString()} ?.?
                        </Text>
                        <Badge colorPalette="gray" fontSize="xs">
                          {conditionLabels[product.condition] || product.condition}
                        </Badge>
                      </HStack>

                      <HStack justify="space-between">
                        <Text fontSize="xs" color="gray.500">
                          {product.seller?.storeName}
                        </Text>
                        {product.ratingCount > 0 && (
                          <HStack gap={1}>
                            <Text fontSize="xs" color="yellow.600">? {Number(product.ratingAvg).toFixed(1)}</Text>
                            <Text fontSize="xs" color="gray.400">({product.ratingCount})</Text>
                          </HStack>
                        )}
                      </HStack>

                      {product.category && (
                        <Badge colorPalette="blue" fontSize="xs" w="fit-content">
                          {product.category.nameAr || product.category.name}
                        </Badge>
                      )}
                    </VStack>
                  </Box>
                </Link>
              ))}
            </SimpleGrid>
          )}

          {/* Coming Soon Features */}
          <Box className="neon-card" p={8}>
            <VStack gap={4} align="stretch">
              <HStack>
                <Text fontSize="xl">??</Text>
                <Heading size="md" color="black">
                  ???? ??????
                </Heading>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                {[
                  { icon: '??', title: '?? ?????', desc: '???? ???????? ??????' },
                  { icon: '??', title: '????? ?????', desc: '???? ?????? ?????' },
                  { icon: '???', title: '???? ?????', desc: '?????? ????? ????' },
                ].map((f) => (
                  <HStack key={f.title} p={4} bg="gray.50" borderRadius="lg" gap={3}>
                    <Text fontSize="2xl">{f.icon}</Text>
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" color="black" fontSize="sm">{f.title}</Text>
                      <Text fontSize="xs" color="gray.500">{f.desc}</Text>
                    </VStack>
                  </HStack>
                ))}
              </SimpleGrid>
            </VStack>
          </Box>

          {/* CTA */}
          <HStack justify="center" gap={4} flexWrap="wrap">
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                ???? ?? ????????
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" borderColor="black" color="black" size="lg">
                ???? ??? ?????
              </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
