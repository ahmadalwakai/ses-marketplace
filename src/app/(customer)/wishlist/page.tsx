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
  Button,
} from '@chakra-ui/react';
import { useWishlistStore } from '@/lib/store';

// Skeleton component
function ProductSkeleton() {
  return (
    <Box
      borderWidth={2}
      borderColor="gray.200"
      borderRadius="xl"
      p={4}
      animation="pulse"
    >
      <VStack align="stretch" gap={3}>
        <Box h="200px" bg="gray.100" borderRadius="lg" />
        <Box h="20px" bg="gray.100" borderRadius="md" w="80%" />
        <Box h="16px" bg="gray.100" borderRadius="md" w="50%" />
        <HStack justify="space-between">
          <Box h="24px" bg="gray.100" borderRadius="md" w="30%" />
          <Box h="32px" bg="gray.100" borderRadius="md" w="20%" />
        </HStack>
      </VStack>
    </Box>
  );
}

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show skeleton while hydrating
  if (!mounted) {
    return (
      <Box minH="100vh" bg="white" py={10}>
        <Container maxW="7xl">
          <VStack gap={8} align="stretch">
            <VStack gap={2} textAlign="center">
              <Heading size="2xl" color="black">
                المفضلة
              </Heading>
              <Text color="gray.600">
                منتجاتك المفضلة في مكان واحد
              </Text>
            </VStack>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {[1, 2, 3, 4].map((i) => (
                <ProductSkeleton key={i} />
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <VStack gap={2} textAlign="center">
            <Heading size="2xl" color="black">
              المفضلة
            </Heading>
            <Text color="gray.600">
              منتجاتك المفضلة في مكان واحد
            </Text>
          </VStack>

          {/* Actions */}
          {items.length > 0 && (
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text color="gray.600">
                {items.length} منتج في المفضلة
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderColor="black"
                color="black"
                onClick={clearWishlist}
              >
                مسح الكل
              </Button>
            </HStack>
          )}

          {/* Empty State */}
          {items.length === 0 ? (
            <Box
              className="neon-card"
              p={12}
              textAlign="center"
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <VStack gap={4}>
                <Text fontSize="4xl">♡</Text>
                <Heading size="lg" color="black">
                  قائمة المفضلة فارغة
                </Heading>
                <Text color="gray.600">
                  أضف منتجات إلى المفضلة لتجدها بسهولة لاحقاً
                </Text>
                <Link href="/products">
                  <Button
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    size="lg"
                  >
                    تصفح المنتجات
                  </Button>
                </Link>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {items.map((item) => (
                <Box
                  key={item.productId}
                  borderWidth={2}
                  borderColor="black"
                  borderRadius="xl"
                  boxShadow="4px 4px 0 0 black"
                  overflow="hidden"
                  transition="all 0.2s"
                  _hover={{ transform: 'translateY(-4px)' }}
                >
                  <Link href={`/products/${item.slug}`}>
                    <Box h="200px" bg="gray.100" overflow="hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <VStack h="full" justify="center">
                          <Text color="gray.400">لا توجد صورة</Text>
                        </VStack>
                      )}
                    </Box>
                  </Link>

                  <VStack align="stretch" p={4} gap={3}>
                    <Link href={`/products/${item.slug}`}>
                      <Text
                        fontWeight="semibold"
                        color="black"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                        _hover={{ textDecoration: 'underline' }}
                      >
                        {item.titleAr || item.title}
                      </Text>
                    </Link>

                    <HStack justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="lg" color="black">
                        {item.price.toLocaleString()} ل.س
                      </Text>
                      <Button
                        size="sm"
                        variant="ghost"
                        color="red.500"
                        onClick={() => removeItem(item.productId)}
                        _hover={{ bg: 'red.50' }}
                      >
                        حذف
                      </Button>
                    </HStack>

                    <Link href={`/products/${item.slug}`}>
                      <Button
                        w="full"
                        bg="black"
                        color="white"
                        _hover={{ bg: 'gray.800' }}
                      >
                        عرض المنتج
                      </Button>
                    </Link>
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
