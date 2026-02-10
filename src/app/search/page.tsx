'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Spinner,
  Image,
} from '@chakra-ui/react';

interface SearchProduct {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string;
  price: string;
  currency: string;
  condition: string;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; alt: string | null }[];
  seller: { id: string; storeName: string; slug: string } | null;
  category: { id: string; name: string; nameAr: string | null; slug: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get('q') || '';

  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const formatPrice = (amount: string | number) =>
    new Intl.NumberFormat('ar-SY').format(Number(amount)) + ' ل.س';

  const conditionLabels: Record<string, string> = {
    NEW: 'جديد',
    LIKE_NEW: 'شبه جديد',
    GOOD: 'جيد',
    FAIR: 'مقبول',
    POOR: 'مستعمل',
  };

  const fetchResults = useCallback(
    async (searchQuery: string, pageNum: number) => {
      if (!searchQuery.trim()) {
        setProducts([]);
        setPagination(null);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          page: String(pageNum),
          limit: '20',
        });
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        if (data.ok && data.data) {
          setProducts(data.data.items || []);
          setPagination(data.data.pagination || null);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (q) {
      setQuery(q);
      fetchResults(q, 1);
      setPage(1);
    }
  }, [q, fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchResults(q, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box bg="white" minH="100vh">
      <Container maxW="6xl" py={8}>
        <VStack align="stretch" gap={6}>
          <Text fontSize="2xl" fontWeight="bold" color="black">
            🔍 البحث
          </Text>

          {/* Search Form */}
          <form onSubmit={handleSearch}>
            <HStack>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن منتجات، ماركات، متاجر..."
                size="lg"
                borderWidth={2}
                borderColor="black"
                _focus={{ boxShadow: '2px 2px 0 0 black' }}
                flex={1}
              />
              <Button
                type="submit"
                size="lg"
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                px={8}
              >
                بحث
              </Button>
            </HStack>
          </form>

          {/* Results Header */}
          {q && !loading && pagination && (
            <Text color="gray.600">
              {pagination.total > 0
                ? `تم العثور على ${pagination.total} نتيجة لـ "${q}"`
                : `لا توجد نتائج لـ "${q}"`}
            </Text>
          )}

          {/* Loading */}
          {loading && (
            <VStack py={12}>
              <Spinner size="lg" color="black" />
              <Text color="gray.600">جاري البحث...</Text>
            </VStack>
          )}

          {/* No query */}
          {!q && !loading && (
            <VStack py={16} gap={4}>
              <Text fontSize="6xl">🔍</Text>
              <Text fontSize="xl" color="gray.600">
                ابحث عن منتجات، ماركات، أو متاجر
              </Text>
            </VStack>
          )}

          {/* No Results */}
          {q && !loading && products.length === 0 && pagination && (
            <VStack py={12} gap={4}>
              <Text fontSize="5xl">😔</Text>
              <Text fontSize="lg" color="gray.600">
                لم نجد نتائج مطابقة
              </Text>
              <Text color="gray.500" fontSize="sm">
                جرّب كلمات بحث مختلفة أو تصفّح الفئات
              </Text>
              <Link href="/categories">
                <Button variant="outline" borderColor="black" color="black">
                  تصفح الفئات
                </Button>
              </Link>
            </VStack>
          )}

          {/* Results Grid */}
          {!loading && products.length > 0 && (
            <Box
              display="grid"
              gridTemplateColumns={{
                base: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              }}
              gap={4}
            >
              {products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                >
                  <Box
                    borderWidth={2}
                    borderColor="black"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="white"
                    boxShadow="2px 2px 0 0 black"
                    _hover={{
                      boxShadow: '4px 4px 0 0 black',
                      transform: 'translate(-2px, -2px)',
                    }}
                    transition="all 0.15s"
                    h="100%"
                  >
                    {/* Image */}
                    <Box h="180px" bg="gray.100" overflow="hidden">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0].url}
                          alt={product.titleAr || product.title}
                          w="100%"
                          h="100%"
                          objectFit="cover"
                        />
                      ) : (
                        <VStack h="100%" justify="center">
                          <Text fontSize="3xl" color="gray.300">
                            📦
                          </Text>
                        </VStack>
                      )}
                    </Box>

                    {/* Details */}
                    <VStack align="start" p={3} gap={1}>
                      <Text
                        fontWeight="bold"
                        color="black"
                        fontSize="sm"
                        lineClamp={2}
                      >
                        {product.titleAr || product.title}
                      </Text>

                      {product.category && (
                        <Text fontSize="xs" color="gray.500">
                          {product.category.nameAr || product.category.name}
                        </Text>
                      )}

                      <HStack gap={2} flexWrap="wrap">
                        <Text
                          fontSize="xs"
                          bg="gray.100"
                          px={2}
                          py={0.5}
                          borderRadius="full"
                          color="gray.700"
                        >
                          {conditionLabels[product.condition] || product.condition}
                        </Text>
                        {product.ratingAvg > 0 && (
                          <Text fontSize="xs" color="yellow.600">
                            ⭐ {product.ratingAvg.toFixed(1)} ({product.ratingCount})
                          </Text>
                        )}
                      </HStack>

                      <Text fontWeight="bold" color="black" fontSize="md">
                        {formatPrice(product.price)}
                      </Text>

                      {product.seller && (
                        <Text fontSize="xs" color="gray.500">
                          {product.seller.storeName}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </Link>
              ))}
            </Box>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <HStack justify="center" gap={2} py={4}>
              <Button
                size="sm"
                variant="outline"
                borderColor="black"
                color="black"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                السابق
              </Button>
              <Text color="gray.600" fontSize="sm">
                صفحة {page} من {pagination.totalPages}
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderColor="black"
                color="black"
                disabled={!pagination.hasMore}
                onClick={() => handlePageChange(page + 1)}
              >
                التالي
              </Button>
            </HStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <Box bg="white" minH="100vh">
          <Container maxW="6xl" py={8}>
            <VStack py={12}>
              <Spinner size="lg" color="black" />
              <Text color="gray.600">جاري التحميل...</Text>
            </VStack>
          </Container>
        </Box>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
