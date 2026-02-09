'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Spinner,
  Button,
} from '@chakra-ui/react';

interface Store {
  id: string;
  storeName: string;
  bio: string | null;
  verified: boolean;
  rating: number;
  totalSales: number;
  user: { name: string };
  products: {
    id: string;
    title: string;
    slug: string;
    price: number;
    images: { url: string }[];
    category: { name: string };
    averageRating: number | null;
  }[];
}

export default function StoreDetailPage() {
  const params = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.storeid) {
      fetchStore(params.storeid as string);
    }
  }, [params.storeid]);

  const fetchStore = async (storeId: string) => {
    try {
      const res = await fetch(`/api/stores/${storeId}`);
      const data = await res.json();
      if (data.success) {
        setStore(data.data);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!store) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20} gap={4}>
            <Heading color="black">المتجر غير موجود</Heading>
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                تصفح المنتجات
              </Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Store Header */}
          <Box className="neon-card" p={8}>
            <VStack gap={4}>
              <HStack>
                <Heading size="2xl" color="black">
                  {store.storeName}
                </Heading>
                {store.verified && (
                  <Badge colorPalette="green" fontSize="md" px={3} py={1}>
                    موثق ✓
                  </Badge>
                )}
              </HStack>
              
              <Text color="gray.600">
                البائع: {store.user.name}
              </Text>

              {store.bio && (
                <Text color="gray.700" textAlign="center" maxW="600px">
                  {store.bio}
                </Text>
              )}

              <HStack gap={8}>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="black">
                    ★ {store.rating.toFixed(1)}
                  </Text>
                  <Text color="gray.600" fontSize="sm">التقييم</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="black">
                    {store.totalSales}
                  </Text>
                  <Text color="gray.600" fontSize="sm">عملية بيع</Text>
                </VStack>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="black">
                    {store.products.length}
                  </Text>
                  <Text color="gray.600" fontSize="sm">منتج</Text>
                </VStack>
              </HStack>
            </VStack>
          </Box>

          {/* Products */}
          <Box>
            <Heading size="lg" color="black" mb={6}>
              منتجات المتجر
            </Heading>

            {store.products.length === 0 ? (
              <Box className="neon-card" p={8} textAlign="center">
                <Text color="gray.600">لا توجد منتجات في هذا المتجر بعد</Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
                {store.products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Box
                      className="neon-card"
                      p={4}
                      cursor="pointer"
                      transition="all 0.2s"
                      _hover={{ transform: 'translateY(-4px)' }}
                    >
                      <VStack align="stretch" gap={3}>
                        <Box h="180px" bg="gray.100" borderRadius="lg" overflow="hidden">
                          {product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <VStack h="full" justify="center">
                              <Text color="gray.400">لا توجد صورة</Text>
                            </VStack>
                          )}
                        </Box>

                        <VStack align="stretch" gap={1}>
                          <Badge w="fit-content" bg="gray.100" color="gray.700" px={2} py={1}>
                            {product.category.name}
                          </Badge>
                          <Text fontWeight="bold" color="black" lineClamp={2}>
                            {product.title}
                          </Text>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg" color="black">
                              {product.price.toLocaleString()} ل.س
                            </Text>
                            {product.averageRating && (
                              <HStack gap={1}>
                                <Text color="yellow.500">★</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {product.averageRating.toFixed(1)}
                                </Text>
                              </HStack>
                            )}
                          </HStack>
                        </VStack>
                      </VStack>
                    </Box>
                  </Link>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
