'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Button,
  Badge,
  Spinner,
} from '@chakra-ui/react';
import { useSavedStore, useCartStore } from '@/lib/store';

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
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'رديء',
};

type TabKey = 'trending' | 'newest' | 'top-rated';

export default function SESLivePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('trending');
  const savedStore = useSavedStore();
  const cartStore = useCartStore();

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
    { key: 'trending', label: 'الأكثر رواجاً', icon: '🔥' },
    { key: 'newest', label: 'وصل حديثاً', icon: '✨' },
    { key: 'top-rated', label: 'الأعلى تقييماً', icon: '⭐' },
  ];

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <HStack justify="center" gap={3}>
              <Text fontSize="3xl">📡</Text>
              <Heading size="2xl" color="black">
                SES Live
              </Heading>
              <Badge colorPalette="red" fontSize="sm" p={1} px={2} borderRadius="full">
                مباشر
              </Badge>
            </HStack>
            <Text color="gray.600" fontSize="lg">
              تابع المنتجات الرائجة حالياً في السوق السوري الإلكتروني
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
              <Text color="gray.500">جاري التحميل...</Text>
            </VStack>
          ) : products.length === 0 ? (
            <VStack py={16} gap={4}>
              <Text fontSize="5xl">📦</Text>
              <Heading size="md" color="gray.600">
                لا توجد منتجات حالياً
              </Heading>
              <Link href="/products">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                  تصفح كل المنتجات
                </Button>
              </Link>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {products.map((product, index) => (
                <Box
                  key={product.id}
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

                  {/* Save button */}
                  <Box
                    position="absolute"
                    top={2}
                    left={2}
                    zIndex={2}
                    cursor="pointer"
                    bg="white"
                    borderRadius="full"
                    w="32px"
                    h="32px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    boxShadow="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (savedStore.isSaved(product.id)) {
                        savedStore.removeItem(product.id);
                      } else {
                        savedStore.addItem({
                          productId: product.id,
                          title: product.titleAr || product.title,
                          price: Number(product.price),
                          image: product.images[0]?.url,
                          slug: product.slug,
                        });
                      }
                    }}
                  >
                    <Text fontSize="sm">{savedStore.isSaved(product.id) ? '♥' : '♡'}</Text>
                  </Box>

                  <Link href={`/products/${product.slug}`}>
                    {/* Image */}
                    <Box h="200px" bg="gray.100" overflow="hidden" position="relative">
                      {product.images[0]?.url ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.titleAr || product.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                          unoptimized
                        />
                      ) : (
                        <VStack h="full" justify="center">
                          <Text fontSize="4xl">📦</Text>
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
                          {Number(product.price).toLocaleString()} ل.س
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
                            <Text fontSize="xs" color="yellow.600">★ {Number(product.ratingAvg).toFixed(1)}</Text>
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
                  </Link>

                  {/* Quick add to cart */}
                  <Box px={4} pb={4}>
                    <Button
                      size="sm"
                      w="full"
                      bg="black"
                      color="white"
                      _hover={{ bg: 'gray.800' }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        cartStore.addItem({
                          productId: product.id,
                          title: product.titleAr || product.title,
                          price: Number(product.price),
                          quantity: 1,
                          image: product.images[0]?.url,
                        });
                      }}
                    >
                      🛒 أضف للسلة
                    </Button>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Coming Soon Features */}
          <Box className="neon-card" p={8}>
            <VStack gap={4} align="stretch">
              <HStack>
                <Text fontSize="xl">🚀</Text>
                <Heading size="md" color="black">
                  قريباً
                </Heading>
              </HStack>
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                {[
                  { icon: '📺', title: 'بث مباشر', desc: 'عروض مباشرة من البائعين' },
                  { icon: '⏰', title: 'عروض محدودة', desc: 'خصومات لفترة محدودة' },
                  { icon: '🏷️', title: 'كوبون خصم', desc: 'كوبونات حصرية للمتابعين' },
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
                تصفح كل المنتجات
              </Button>
            </Link>
            <Link href="/categories">
              <Button variant="outline" borderColor="black" color="black" size="lg">
                تصفح حسب الفئات
              </Button>
            </Link>
          </HStack>
        </VStack>
      </Container>
    </Box>
  );
}
