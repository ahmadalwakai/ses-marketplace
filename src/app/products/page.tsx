'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (query?: string) => {
    setLoading(true);
    try {
      const url = query 
        ? `/api/products?search=${encodeURIComponent(query)}`
        : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data.products);
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
              تصفح منتجاتنا واختر ما يناسبك
            </Text>
          </VStack>

          {/* Search */}
          <Box
            as="form"
            onSubmit={handleSearch}
            maxW="xl"
            mx="auto"
            w="full"
          >
            <HStack>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
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
                بحث
              </Button>
            </HStack>
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
