'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
import SellerBadge from '@/components/SellerBadge';

interface Store {
  seller: {
    id: string;
    storeName: string;
    slug: string;
    bio: string | null;
    ratingAvg: number;
    ratingCount: number;
    verificationStatus: string;
    verificationLevel?: string | null;
    user: { name: string | null };
  };
  products: {
    id: string;
    title: string;
    titleAr?: string | null;
    slug: string;
    price: number;
    images: { url: string }[];
    ratingAvg: number | null;
    ratingCount: number;
  }[];
  pagination?: {
    page: number;
    totalPages: number;
  };
}

export default function StoreDetailClient({
  initialStore,
  slug,
}: {
  initialStore: Store | null;
  slug: string;
}) {
  const [store, setStore] = useState<Store | null>(initialStore);
  const [loading, setLoading] = useState(!initialStore);

  useEffect(() => {
    if (!initialStore && slug) {
      fetchStore(slug);
    }
  }, [slug, initialStore]);

  const fetchStore = async (storeSlug: string) => {
    try {
      const res = await fetch(`/api/stores/${storeSlug}`);
      const data = await res.json();
      if (data.ok) {
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
                  {store.seller.storeName}
                </Heading>
              </HStack>

              <SellerBadge
                level={store.seller.verificationLevel}
                status={store.seller.verificationStatus}
              />

              <Text color="gray.600">
                البائع: {store.seller.user.name}
              </Text>

              {store.seller.bio && (
                <Text color="gray.700" textAlign="center" maxW="600px">
                  {store.seller.bio}
                </Text>
              )}

              <HStack gap={8}>
                <VStack>
                  <Text fontSize="2xl" fontWeight="bold" color="black">
                    ★ {store.seller.ratingAvg.toFixed(1)}
                  </Text>
                  <Text color="gray.600" fontSize="sm">
                    ({store.seller.ratingCount}) تقييم
                  </Text>
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
                        <Box
                          h="180px"
                          bg="gray.100"
                          borderRadius="lg"
                          overflow="hidden"
                          position="relative"
                        >
                          {product.images[0] ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.titleAr || product.title}
                              fill
                              style={{ objectFit: 'cover' }}
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                          ) : (
                            <VStack h="full" justify="center">
                              <Text color="gray.400">لا توجد صورة</Text>
                            </VStack>
                          )}
                        </Box>

                        <VStack align="stretch" gap={1}>
                          <Text fontWeight="bold" color="black" lineClamp={2}>
                            {product.titleAr || product.title}
                          </Text>
                          <HStack justify="space-between">
                            <Text fontWeight="bold" fontSize="lg" color="black">
                              {product.price.toLocaleString()} ل.س
                            </Text>
                            {product.ratingAvg && (
                              <HStack gap={1}>
                                <Text color="yellow.500">★</Text>
                                <Text fontSize="sm" color="gray.600">
                                  {product.ratingAvg.toFixed(1)} ({product.ratingCount})
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
