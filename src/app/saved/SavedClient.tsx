'use client';

import { useEffect, useState, useMemo } from 'react';
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
} from '@chakra-ui/react';
import { useSavedStore, useWishlistStore } from '@/lib/store';

export default function SavedClient() {
  const { items: savedItems, removeItem: removeSaved, clearSaved } = useSavedStore();
  const { items: wishlistItems, removeItem: removeWishlist, clearWishlist } = useWishlistStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const allItems = useMemo(() => {
    const map = new Map<string, { productId: string; title: string; titleAr?: string; price: number; image?: string; slug: string; source: 'saved' | 'wishlist' }>();
    for (const item of savedItems) {
      map.set(item.productId, { ...item, source: 'saved' });
    }
    for (const item of wishlistItems) {
      if (!map.has(item.productId)) {
        map.set(item.productId, { ...item, source: 'wishlist' });
      }
    }
    return Array.from(map.values());
  }, [savedItems, wishlistItems]);

  const handleRemove = (productId: string, source: 'saved' | 'wishlist') => {
    if (source === 'saved') removeSaved(productId);
    else removeWishlist(productId);
  };

  const handleClearAll = () => {
    clearSaved();
    clearWishlist();
  };

  if (!mounted) {
    return (
      <Box minH="100vh" bg="white" py={10}>
        <Container maxW="7xl">
          <VStack py={20}>
            <Heading size="2xl" color="black">المحفوظات</Heading>
            <Text color="gray.600">جارٍ التحميل...</Text>
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
              🔖 المحفوظات
            </Heading>
            <Text color="gray.600">
              المنتجات التي حفظتها للرجوع إليها لاحقاً
            </Text>
          </VStack>

          {/* Actions */}
          {allItems.length > 0 && (
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text color="gray.600">
                {allItems.length} منتج محفوظ
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderColor="black"
                color="black"
                onClick={handleClearAll}
              >
                مسح الكل
              </Button>
            </HStack>
          )}

          {/* Items */}
          {allItems.length === 0 ? (
            <VStack py={16} gap={4}>
              <Text fontSize="5xl">🔖</Text>
              <Heading size="md" color="gray.600">
                لا توجد منتجات محفوظة
              </Heading>
              <Text color="gray.500">
                احفظ المنتجات التي تعجبك للعودة إليها لاحقاً
              </Text>
              <Link href="/products">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }} size="lg">
                  تصفح المنتجات
                </Button>
              </Link>
            </VStack>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
              {allItems.map((item) => (
                <Box
                  key={item.productId}
                  className="neon-card"
                  borderRadius="xl"
                  overflow="hidden"
                >
                  {/* Image */}
                  <Link href={`/products/${item.slug}`}>
                    <Box h="200px" bg="gray.100" position="relative">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.titleAr || item.title}
                          fill
                          style={{ objectFit: 'cover' }}
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        />
                      ) : (
                        <VStack h="full" justify="center">
                          <Text fontSize="4xl">📦</Text>
                        </VStack>
                      )}
                    </Box>
                  </Link>

                  {/* Info */}
                  <VStack p={4} align="stretch" gap={2}>
                    <Link href={`/products/${item.slug}`}>
                      <Text fontWeight="bold" color="black" lineClamp={2}>
                        {item.titleAr || item.title}
                      </Text>
                    </Link>

                    <HStack justify="space-between">
                      <Text fontWeight="bold" color="black" fontSize="lg">
                        {item.price.toLocaleString()} ل.س
                      </Text>
                      <Button
                        size="xs"
                        variant="outline"
                        borderColor="red.500"
                        color="red.500"
                        onClick={() => handleRemove(item.productId, item.source)}
                      >
                        حذف
                      </Button>
                    </HStack>
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
