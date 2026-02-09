'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Spinner,
} from '@chakra-ui/react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count: { products: number };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              الفئات
            </Heading>
            <Text color="gray.600">
              تصفح المنتجات حسب الفئة
            </Text>
          </VStack>

          {categories.length === 0 ? (
            <Box className="neon-card" p={8} textAlign="center">
              <Text color="gray.600">لا توجد فئات بعد</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {categories.map((category) => (
                <Link key={category.id} href={`/products?category=${category.slug}`}>
                  <Box
                    className="neon-card"
                    p={6}
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-4px)' }}
                    textAlign="center"
                  >
                    <VStack gap={3}>
                      <Box
                        w="80px"
                        h="80px"
                        bg="gray.100"
                        borderRadius="xl"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Text fontSize="3xl">📦</Text>
                      </Box>
                      <VStack gap={1}>
                        <Heading size="md" color="black">
                          {category.name}
                        </Heading>
                        {category.description && (
                          <Text fontSize="sm" color="gray.600" lineClamp={2}>
                            {category.description}
                          </Text>
                        )}
                        <Text fontSize="sm" color="gray.500">
                          {category._count.products} منتج
                        </Text>
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
