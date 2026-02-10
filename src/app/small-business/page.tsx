'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Input,
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
  images: { url: string; alt?: string }[];
  seller: { id: string; storeName: string; slug: string; ratingAvg: number };
  category: { id: string; name: string; nameAr?: string; slug: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const conditionLabels: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'مستعمل',
};

export default function SmallBusinessPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('relevance');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  const fetchProducts = async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('smallBusiness', 'true');
      params.set('page', String(page));
      params.set('limit', '20');
      if (query || search) params.set('q', query || search);
      if (sort) params.set('sort', sort);

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      console.error('Error fetching small business products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts(search);
  };

  return (
    <Box minH="100vh" bg="white">
      {/* Hero */}
      <Box bg="green.600" color="white" py={16}>
        <Container maxW="container.xl">
          <VStack gap={4} textAlign="center">
            <Text fontSize="4xl">🏪</Text>
            <Heading as="h1" size="2xl">
              أعمال صغيرة
            </Heading>
            <Text fontSize="lg" maxW="600px">
              ادعم الأعمال الصغيرة والبائعين الموثقين في سوريا - منتجات مميزة من بائعين معتمدين
            </Text>
            <Text fontSize="md" opacity={0.9}>
              Small Business — Support verified local sellers
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxW="7xl" py={10}>
        <VStack gap={8} align="stretch">
          {/* Search & Sort */}
          <Box as="form" onSubmit={handleSearch} maxW="3xl" mx="auto" w="full">
            <HStack>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث في منتجات الأعمال الصغيرة..."
                size="lg"
                borderWidth={2}
                borderColor="green.500"
                _focus={{ boxShadow: '2px 2px 0 0 green' }}
              />
              <Button
                type="submit"
                size="lg"
                bg="green.600"
                color="white"
                _hover={{ bg: 'green.700' }}
                px={8}
              >
                🔍 بحث
              </Button>
            </HStack>
          </Box>

          {/* Sort Controls */}
          <HStack justify="space-between" flexWrap="wrap">
            <Text fontWeight="bold" color="gray.600">
              {pagination ? `${pagination.total} منتج` : ''}
            </Text>
            <HStack gap={2}>
              {[
                { value: 'relevance', label: 'الأكثر صلة' },
                { value: 'newest', label: 'الأحدث' },
                { value: 'price_asc', label: 'الأرخص' },
                { value: 'price_desc', label: 'الأغلى' },
                { value: 'rating', label: 'الأعلى تقييماً' },
              ].map((s) => (
                <Button
                  key={s.value}
                  size="sm"
                  variant={sort === s.value ? 'solid' : 'outline'}
                  bg={sort === s.value ? 'green.600' : undefined}
                  color={sort === s.value ? 'white' : 'green.700'}
                  borderColor="green.500"
                  onClick={() => { setSort(s.value); setPage(1); }}
                >
                  {s.label}
                </Button>
              ))}
            </HStack>
          </HStack>

          {/* Products Grid */}
          {loading ? (
            <VStack py={20}>
              <Spinner size="xl" color="green.500" />
              <Text color="gray.500">جاري تحميل المنتجات...</Text>
            </VStack>
          ) : products.length === 0 ? (
            <VStack py={20} gap={4}>
              <Text fontSize="4xl">🏪</Text>
              <Heading size="lg" color="gray.600">
                لا توجد منتجات حالياً
              </Heading>
              <Text color="gray.500">
                لم يتم العثور على منتجات من الأعمال الصغيرة. جرب تغيير البحث أو تصفح جميع المنتجات.
              </Text>
              <Link href="/products">
                <Button bg="green.600" color="white" _hover={{ bg: 'green.700' }}>
                  تصفح جميع المنتجات
                </Button>
              </Link>
            </VStack>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
                {products.map((product) => (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <Box
                      borderWidth={2}
                      borderColor="gray.200"
                      borderRadius="lg"
                      overflow="hidden"
                      transition="all 0.2s"
                      _hover={{
                        transform: 'translateY(-4px)',
                        borderColor: 'green.500',
                        boxShadow: '4px 4px 0 0 #38a169',
                      }}
                      bg="white"
                      h="full"
                    >
                      {/* Product Image */}
                      <Box h="200px" bg="gray.100" position="relative">
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.titleAr || product.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                        ) : (
                          <VStack h="full" justify="center">
                            <Text fontSize="3xl">📷</Text>
                          </VStack>
                        )}
                        <Badge
                          position="absolute"
                          top={2}
                          right={2}
                          bg="green.500"
                          color="white"
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          ✅ بائع موثق
                        </Badge>
                      </Box>

                      {/* Product Info */}
                      <VStack p={4} align="stretch" gap={2}>
                        <Text fontWeight="bold" lineClamp={2} color="black">
                          {product.titleAr || product.title}
                        </Text>
                        <HStack justify="space-between">
                          <Text fontWeight="bold" color="green.600" fontSize="lg">
                            {Number(product.price).toLocaleString()} {product.currency}
                          </Text>
                          <Badge variant="outline" colorScheme="green" fontSize="xs">
                            {conditionLabels[product.condition] || product.condition}
                          </Badge>
                        </HStack>
                        {product.seller && (
                          <Text fontSize="sm" color="gray.500" lineClamp={1}>
                            🏪 {product.seller.storeName}
                          </Text>
                        )}
                        {product.ratingCount > 0 && (
                          <HStack gap={1}>
                            <Text fontSize="sm" color="yellow.500">★</Text>
                            <Text fontSize="sm" color="gray.600">
                              {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                            </Text>
                          </HStack>
                        )}
                      </VStack>
                    </Box>
                  </Link>
                ))}
              </SimpleGrid>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <HStack justify="center" gap={2} pt={6}>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="green.500"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    السابق
                  </Button>
                  <Text fontSize="sm" color="gray.600">
                    صفحة {page} من {pagination.totalPages}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    borderColor="green.500"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    التالي
                  </Button>
                </HStack>
              )}
            </>
          )}
        </VStack>
      </Container>

      {/* Info Banner */}
      <Box bg="green.50" py={12}>
        <Container maxW="container.xl">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
            <VStack textAlign="center" gap={3}>
              <Text fontSize="3xl">✅</Text>
              <Heading as="h3" size="md">بائعون موثقون</Heading>
              <Text color="gray.600" fontSize="sm">
                جميع البائعين في هذا القسم تم التحقق من هويتهم ومتاجرهم
              </Text>
            </VStack>
            <VStack textAlign="center" gap={3}>
              <Text fontSize="3xl">🤝</Text>
              <Heading as="h3" size="md">ادعم المحلي</Heading>
              <Text color="gray.600" fontSize="sm">
                عند الشراء من هنا فأنت تدعم أعمالاً سورية صغيرة ومحلية
              </Text>
            </VStack>
            <VStack textAlign="center" gap={3}>
              <Text fontSize="3xl">⭐</Text>
              <Heading as="h3" size="md">جودة مضمونة</Heading>
              <Text color="gray.600" fontSize="sm">
                منتجات مختارة بعناية من بائعين ذوي تقييمات عالية
              </Text>
            </VStack>
          </SimpleGrid>
        </Container>
      </Box>
    </Box>
  );
}
