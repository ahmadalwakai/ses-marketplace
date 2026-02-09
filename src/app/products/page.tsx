'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  slug: string;
  price: number;
  images: { url: string }[];
  category: { name: string };
  seller: { storeName: string };
  averageRating: number | null;
  totalReviews: number;
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const showAdvancedParam = searchParams.get('advanced') === 'true';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQ);
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedParam);

  // Advanced filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('relevance');
  const [smartSearchLoading, setSmartSearchLoading] = useState(false);
  const [smartSearchResult, setSmartSearchResult] = useState<{
    expandedQuery: string;
    relatedTerms: string[];
  } | null>(null);
  const [aggregations, setAggregations] = useState<{
    conditions: { condition: string; count: number }[];
    priceRange: { min: number; max: number };
    categories: { categoryId: string; count: number }[];
  } | null>(null);

  useEffect(() => {
    fetchProducts(initialQ);
  }, [initialQ]);

  const fetchProducts = async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (condition) params.set('condition', condition);
      if (sort) params.set('sort', sort);
      
      const url = `/api/search?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
        if (data.aggregations) {
          setAggregations(data.aggregations);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const handleApplyFilters = () => {
    fetchProducts(search);
  };

  const handleClearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setSort('relevance');
    fetchProducts(search);
  };

  const handleSmartSearch = async () => {
    if (!search.trim()) return;
    setSmartSearchLoading(true);
    setSmartSearchResult(null);
    try {
      const res = await fetch('/api/ai/customer/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: search.trim(), language: 'ar' }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setSmartSearchResult(data.data);
        if (data.data.expandedQuery) setSearch(data.data.expandedQuery);
        const sf = data.data.suggestedFilters;
        if (sf?.priceRange?.min) setMinPrice(String(sf.priceRange.min));
        if (sf?.priceRange?.max) setMaxPrice(String(sf.priceRange.max));
        if (sf?.conditions?.[0]) setCondition(sf.conditions[0]);
        fetchProducts(data.data.expandedQuery || search);
      }
    } catch (error) {
      console.error('Smart search error:', error);
    } finally {
      setSmartSearchLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={4}>
            <Heading size="2xl" color="black">
              جميع المنتجات
            </Heading>
            <Text color="gray.600" textAlign="center">
              ابحث عن أي شيء - تصفح منتجاتنا واختر ما يناسبك
            </Text>
          </VStack>

          {/* Search */}
          <Box as="form" onSubmit={handleSearch} maxW="3xl" mx="auto" w="full">
            <VStack gap={3}>
              <HStack w="full">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="ابحث عن أي شيء..."
                  size="lg"
                  borderWidth={2}
                  borderColor="black"
                  _focus={{ boxShadow: '2px 2px 0 0 black' }}
                />
                <Button
                  type="submit"
                  size="lg"
                  bg="black"
                  color="white"
                  _hover={{ bg: 'gray.800' }}
                  px={8}
                >
                  🔍 بحث
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  borderColor="black"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  px={6}
                >
                  {showAdvanced ? '▲ إخفاء' : '▼ بحث متقدم'}
                </Button>
                <Button
                  type="button"
                  size="lg"
                  bg="purple.600"
                  color="white"
                  _hover={{ bg: 'purple.700' }}
                  px={6}
                  onClick={handleSmartSearch}
                  disabled={!search.trim() || smartSearchLoading}
                >
                  {smartSearchLoading ? <Spinner size="sm" /> : '🤖 بحث ذكي'}
                </Button>
              </HStack>

              {/* Advanced Filters Panel */}
              {showAdvanced && (
                <Box
                  w="full"
                  p={6}
                  borderWidth={2}
                  borderColor="black"
                  borderRadius="lg"
                  bg="gray.50"
                  boxShadow="4px 4px 0 0 black"
                >
                  <VStack gap={4} align="stretch">
                    <Text fontWeight="bold" fontSize="lg">بحث متقدم</Text>
                    
                    {/* Price Range */}
                    <HStack gap={4}>
                      <VStack align="stretch" flex={1}>
                        <Text fontSize="sm" fontWeight="medium">الحد الأدنى للسعر</Text>
                        <Input
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="0"
                          type="number"
                          borderWidth={2}
                          borderColor="black"
                        />
                      </VStack>
                      <VStack align="stretch" flex={1}>
                        <Text fontSize="sm" fontWeight="medium">الحد الأقصى للسعر</Text>
                        <Input
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="999999"
                          type="number"
                          borderWidth={2}
                          borderColor="black"
                        />
                      </VStack>
                    </HStack>

                    {/* Condition */}
                    <VStack align="stretch">
                      <Text fontSize="sm" fontWeight="medium">الحالة</Text>
                      <HStack gap={2} flexWrap="wrap">
                        {['', 'NEW', 'LIKE_NEW', 'GOOD', 'FAIR'].map((c) => (
                          <Button
                            key={c}
                            size="sm"
                            variant={condition === c ? 'solid' : 'outline'}
                            bg={condition === c ? 'black' : undefined}
                            color={condition === c ? 'white' : 'black'}
                            borderColor="black"
                            onClick={() => setCondition(c)}
                          >
                            {c === '' ? 'الكل' : c === 'NEW' ? 'جديد' : c === 'LIKE_NEW' ? 'كالجديد' : c === 'GOOD' ? 'جيد' : 'مقبول'}
                          </Button>
                        ))}
                      </HStack>
                    </VStack>

                    {/* Sort */}
                    <VStack align="stretch">
                      <Text fontSize="sm" fontWeight="medium">ترتيب حسب</Text>
                      <HStack gap={2} flexWrap="wrap">
                        {[
                          { value: 'relevance', label: 'الأكثر صلة' },
                          { value: 'newest', label: 'الأحدث' },
                          { value: 'price_asc', label: 'السعر: الأقل' },
                          { value: 'price_desc', label: 'السعر: الأعلى' },
                          { value: 'rating', label: 'التقييم' },
                        ].map((s) => (
                          <Button
                            key={s.value}
                            size="sm"
                            variant={sort === s.value ? 'solid' : 'outline'}
                            bg={sort === s.value ? 'black' : undefined}
                            color={sort === s.value ? 'white' : 'black'}
                            borderColor="black"
                            onClick={() => setSort(s.value)}
                          >
                            {s.label}
                          </Button>
                        ))}
                      </HStack>
                    </VStack>

                    {/* Apply / Clear */}
                    <HStack gap={2}>
                      <Button
                        bg="black"
                        color="white"
                        _hover={{ bg: 'gray.800' }}
                        onClick={handleApplyFilters}
                        flex={1}
                      >
                        تطبيق الفلاتر
                      </Button>
                      <Button
                        variant="outline"
                        borderColor="black"
                        onClick={handleClearFilters}
                      >
                        مسح
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}

              {/* Smart Search Suggestions */}
              {smartSearchResult && smartSearchResult.relatedTerms.length > 0 && (
                <Box p={3} borderWidth={1} borderColor="purple.200" borderRadius="lg" bg="purple.50">
                  <HStack gap={2} flexWrap="wrap">
                    <Text fontSize="sm" color="purple.700" fontWeight="bold">🤖 بحث مقترح:</Text>
                    {smartSearchResult.relatedTerms.map((term: string) => (
                      <Button
                        key={term}
                        size="xs"
                        variant="outline"
                        borderColor="purple.300"
                        color="purple.600"
                        _hover={{ bg: 'purple.100' }}
                        onClick={() => {
                          setSearch(term);
                          fetchProducts(term);
                        }}
                      >
                        {term}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              )}
            </VStack>
          </Box>

          {/* Products Grid */}
          {loading ? (
            <VStack py={20}>
              <Spinner size="xl" color="black" />
              <Text color="gray.600">جاري التحميل...</Text>
            </VStack>
          ) : products.length === 0 ? (
            <VStack py={20}>
              <Text fontSize="xl" color="gray.600">
                لا توجد منتجات
              </Text>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <Box
                    className="neon-card"
                    p={4}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-4px)' }}
                  >
                    <VStack align="stretch" gap={3}>
                      {/* Image */}
                      <Box
                        h="200px"
                        bg="gray.100"
                        borderRadius="lg"
                        overflow="hidden"
                      >
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

                      {/* Details */}
                      <VStack align="stretch" gap={1}>
                        <Badge
                          w="fit-content"
                          bg="gray.100"
                          color="gray.700"
                          px={2}
                          py={1}
                          borderRadius="md"
                        >
                          {product.category.name}
                        </Badge>
                        <Text fontWeight="bold" color="black" lineClamp={2}>
                          {product.title}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {product.seller.storeName}
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
        </VStack>
      </Container>
    </Box>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20}>
            <Spinner size="xl" color="black" />
          </VStack>
        </Container>
      </Box>
    }>
      <ProductsContent />
    </Suspense>
  );
}