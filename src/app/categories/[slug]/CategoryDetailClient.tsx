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
  Badge,
  Spinner,
  Button,
} from '@chakra-ui/react';

interface Product {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string;
  price: number;
  condition: string;
  images: { url: string; alt: string | null }[];
  category: { id: string; name: string; nameAr: string | null; slug: string } | null;
  seller: { id: string; storeName: string; slug: string };
  ratingAvg: number | null;
  ratingCount: number;
}

interface CategoryInfo {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  children: CategoryInfo[];
}

interface CategoryPayload {
  category: CategoryInfo | null;
  products: Product[];
  total: number;
}

export default function CategoryDetailClient({
  initialData,
  slug,
}: {
  initialData: CategoryPayload | null;
  slug: string;
}) {
  const [products, setProducts] = useState<Product[]>(initialData?.products || []);
  const [category, setCategory] = useState<CategoryInfo | null>(initialData?.category || null);
  const [loading, setLoading] = useState(!initialData);
  const [total, setTotal] = useState(initialData?.total || 0);

  useEffect(() => {
    if (!initialData && slug) {
      fetchCategoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, initialData]);

  const fetchCategoryData = async () => {
    setLoading(true);
    try {
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      if (catData.success) {
        const found = findCategory(catData.data, slug);
        setCategory(found);

        if (found) {
          const prodRes = await fetch(`/api/search?categoryId=${found.id}`);
          const prodData = await prodRes.json();
          if (prodData.success) {
            setProducts(prodData.data || []);
            setTotal(prodData.pagination?.total || prodData.data?.length || 0);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const findCategory = (cats: CategoryInfo[], targetSlug: string): CategoryInfo | null => {
    for (const cat of cats) {
      if (cat.slug === targetSlug) return cat;
      if (cat.children) {
        const found = findCategory(cat.children, targetSlug);
        if (found) return found;
      }
    }
    return null;
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

  if (!category) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="7xl">
          <VStack py={20} gap={4}>
            <Text fontSize="xl" color="gray.600">التصنيف غير موجود</Text>
            <Link href="/categories">
              <Button bg="black" color="white">العودة لكل الفئات</Button>
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
          {/* Breadcrumb */}
          <HStack gap={2} fontSize="sm" color="gray.500">
            <Link href="/">الرئيسية</Link>
            <Text>›</Text>
            <Link href="/categories">كل الفئات</Link>
            <Text>›</Text>
            <Text color="black" fontWeight="bold">{category.nameAr || category.name}</Text>
          </HStack>

          {/* Header */}
          <VStack gap={2}>
            <Heading size="2xl" color="black">
              {category.nameAr || category.name}
            </Heading>
            <Text color="gray.600">
              {total} منتج في هذا التصنيف
            </Text>
          </VStack>

          {/* Subcategories */}
          {category.children && category.children.length > 0 && (
            <Box>
              <Text fontWeight="bold" mb={3}>التصنيفات الفرعية:</Text>
              <HStack gap={2} flexWrap="wrap">
                {category.children.map((sub) => (
                  <Link key={sub.id} href={`/categories/${sub.slug}`}>
                    <Badge
                      px={4}
                      py={2}
                      borderRadius="full"
                      borderWidth={2}
                      borderColor="black"
                      cursor="pointer"
                      _hover={{ bg: 'black', color: 'white' }}
                      transition="all 0.2s"
                    >
                      {sub.nameAr || sub.name}
                    </Badge>
                  </Link>
                ))}
              </HStack>
            </Box>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <VStack py={20}>
              <Text fontSize="xl" color="gray.600">
                لا توجد منتجات في هذا التصنيف
              </Text>
              <Link href="/products">
                <Button bg="black" color="white" mt={4}>تصفح جميع المنتجات</Button>
              </Link>
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
                      <Box
                        h="200px"
                        bg="gray.100"
                        borderRadius="lg"
                        overflow="hidden"
                        position="relative"
                      >
                        {product.images?.[0] ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.images[0].alt || product.title}
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
                        <Text fontSize="sm" color="gray.600">
                          {product.seller?.storeName}
                        </Text>
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="lg" color="black">
                            {product.price?.toLocaleString()} ل.س
                          </Text>
                          {product.ratingAvg && (
                            <HStack gap={1}>
                              <Text color="yellow.500">★</Text>
                              <Text fontSize="sm" color="gray.600">
                                {Number(product.ratingAvg).toFixed(1)}
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
