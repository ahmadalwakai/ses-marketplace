'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Spinner,
  Button,
} from '@chakra-ui/react';

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  sortOrder: number;
  productCount: number;
  children: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

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

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
              كل الفئات
            </Heading>
            <Text color="gray.600">
              تسوق حسب الفئة - اختر التصنيف المناسب
            </Text>
          </VStack>

          {/* Search + Advanced links */}
          <HStack justify="center" gap={4}>
            <Link href="/products">
              <Button size="md" bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                🔍 ابحث عن أي شيء
              </Button>
            </Link>
            <Link href="/products?advanced=true">
              <Button size="md" variant="outline" borderColor="black">
                بحث متقدم
              </Button>
            </Link>
          </HStack>

          {categories.length === 0 ? (
            <Box className="neon-card" p={8} textAlign="center">
              <Text color="gray.600">لا توجد فئات بعد</Text>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {categories.map((category) => (
                <Box
                  key={category.id}
                  className="neon-card"
                  p={6}
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <VStack gap={3} align="stretch">
                    <Link href={`/categories/${category.slug}`}>
                      <Box cursor="pointer" textAlign="center">
                        <Box
                          w="80px"
                          h="80px"
                          bg="gray.100"
                          borderRadius="xl"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          mx="auto"
                        >
                          <Text fontSize="3xl">📦</Text>
                        </Box>
                        <Heading size="md" color="black" mt={2}>
                          {category.nameAr || category.name}
                        </Heading>
                        <Text fontSize="sm" color="gray.500" mt={1}>
                          {category.productCount} منتج
                        </Text>
                      </Box>
                    </Link>

                    {/* Expandable children */}
                    {category.children && category.children.length > 0 && (
                      <>
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => toggleExpanded(category.id)}
                          color="gray.500"
                        >
                          {expandedIds.includes(category.id) ? '▲ إخفاء' : `▼ ${category.children.length} تصنيف فرعي`}
                        </Button>
                        {expandedIds.includes(category.id) && (
                          <VStack align="stretch" gap={1} pl={2} borderRightWidth={2} borderColor="gray.200">
                            {category.children.map((sub) => (
                              <Link key={sub.id} href={`/categories/${sub.slug}`}>
                                <Box
                                  p={2}
                                  _hover={{ bg: 'gray.50' }}
                                  borderRadius="md"
                                  cursor="pointer"
                                >
                                  <Text fontSize="sm" color="gray.700">
                                    {sub.nameAr || sub.name}
                                  </Text>
                                </Box>
                              </Link>
                            ))}
                          </VStack>
                        )}
                      </>
                    )}
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
