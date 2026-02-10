'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Table,
} from '@chakra-ui/react';
import { useCompareStore } from '@/lib/store';

export default function CompareClient() {
  const { items, removeItem, clearCompare } = useCompareStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Box minH="100vh" bg="white" py={10}>
        <Container maxW="7xl">
          <VStack gap={8} align="stretch">
            <VStack gap={2} textAlign="center">
              <Heading size="2xl" color="black">
                المقارنة
              </Heading>
              <Text color="gray.600">
                قارن بين المنتجات (حتى 4 منتجات)
              </Text>
            </VStack>
            <Box
              borderWidth={2}
              borderColor="gray.200"
              borderRadius="xl"
              p={8}
              h="400px"
              animation="pulse"
            >
              <Box h="full" bg="gray.100" borderRadius="lg" />
            </Box>
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
              المقارنة
            </Heading>
            <Text color="gray.600">
              قارن بين المنتجات (حتى 4 منتجات)
            </Text>
          </VStack>

          {/* Actions */}
          {items.length > 0 && (
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Text color="gray.600">
                {items.length} من 4 منتجات
              </Text>
              <Button
                size="sm"
                variant="outline"
                borderColor="black"
                color="black"
                onClick={clearCompare}
              >
                مسح الكل
              </Button>
            </HStack>
          )}

          {/* Empty State */}
          {items.length === 0 ? (
            <Box
              p={12}
              textAlign="center"
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <VStack gap={4}>
                <Text fontSize="4xl">⚖️</Text>
                <Heading size="lg" color="black">
                  لا توجد منتجات للمقارنة
                </Heading>
                <Text color="gray.600">
                  أضف منتجات للمقارنة من صفحات المنتجات
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
            <Box
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
              overflow="hidden"
            >
              <Box overflowX="auto">
                <Table.Root size="md">
                  <Table.Header>
                    <Table.Row bg="gray.50">
                      <Table.ColumnHeader
                        width="150px"
                        borderRight="1px solid"
                        borderColor="gray.200"
                        fontWeight="bold"
                        color="black"
                      >
                        الخاصية
                      </Table.ColumnHeader>
                      {items.map((item) => (
                        <Table.ColumnHeader
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                          minW="200px"
                        >
                          <VStack gap={2} py={2}>
                            <Box
                              w="100px"
                              h="100px"
                              borderRadius="lg"
                              overflow="hidden"
                              bg="gray.100"
                              mx="auto"
                              position="relative"
                            >
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.titleAr || item.title}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  sizes="100px"
                                />
                              ) : (
                                <VStack h="full" justify="center">
                                  <Text fontSize="xs" color="gray.400">لا توجد صورة</Text>
                                </VStack>
                              )}
                            </Box>
                            <Button
                              size="xs"
                              variant="ghost"
                              color="red.500"
                              onClick={() => removeItem(item.productId)}
                            >
                              إزالة
                            </Button>
                          </VStack>
                        </Table.ColumnHeader>
                      ))}
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {/* Name Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        اسم المنتج
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Link href={`/products/${item.slug}`}>
                            <Text
                              fontWeight="medium"
                              color="black"
                              _hover={{ textDecoration: 'underline' }}
                            >
                              {item.titleAr || item.title}
                            </Text>
                          </Link>
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {/* Price Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        السعر
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Text fontWeight="bold" fontSize="lg" color="black">
                            {item.price.toLocaleString()} ل.س
                          </Text>
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {/* Category Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        الفئة
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Text color="gray.700">
                            {item.category || '-'}
                          </Text>
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {/* Condition Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        الحالة
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Text color="gray.700">
                            {item.condition || '-'}
                          </Text>
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {/* Seller Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        البائع
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Text color="gray.700">
                            {item.seller || '-'}
                          </Text>
                        </Table.Cell>
                      ))}
                    </Table.Row>

                    {/* Rating Row */}
                    <Table.Row>
                      <Table.Cell
                        fontWeight="bold"
                        bg="gray.50"
                        borderRight="1px solid"
                        borderColor="gray.200"
                      >
                        التقييم
                      </Table.Cell>
                      {items.map((item) => (
                        <Table.Cell
                          key={item.productId}
                          textAlign="center"
                          borderRight="1px solid"
                          borderColor="gray.200"
                        >
                          <Text color="gray.700">
                            {item.rating ? `★ ${item.rating.toFixed(1)}` : '-'}
                          </Text>
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
