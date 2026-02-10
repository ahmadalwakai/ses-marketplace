'use client';

import { useCartStore } from '@/lib/store';
import Link from 'next/link';
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Image,
} from '@chakra-ui/react';

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);
  const getTotal = useCartStore((s) => s.getTotal);

  const total = getTotal();

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('ar-SY').format(amount) + ' ل.س';

  return (
    <Box bg="white" minH="100vh">
      <Container maxW="5xl" py={8}>
        <VStack align="stretch" gap={6}>
          <Text fontSize="2xl" fontWeight="bold" color="black">
            🛒 سلة التسوق
          </Text>

          {items.length === 0 ? (
            <VStack py={16} gap={4}>
              <Text fontSize="6xl">🛒</Text>
              <Text fontSize="xl" color="gray.600">
                سلة التسوق فارغة
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
          ) : (
            <>
              {/* Cart Items */}
              <VStack align="stretch" gap={4}>
                {items.map((item) => (
                  <Box
                    key={item.productId}
                    borderWidth={2}
                    borderColor="black"
                    borderRadius="lg"
                    p={4}
                    bg="white"
                    boxShadow="2px 2px 0 0 black"
                  >
                    <HStack
                      gap={4}
                      align="start"
                      flexDir={{ base: 'column', sm: 'row' }}
                    >
                      {/* Image */}
                      {item.image && (
                        <Box
                          w={{ base: '100%', sm: '100px' }}
                          h={{ base: '200px', sm: '100px' }}
                          bg="gray.100"
                          borderRadius="md"
                          overflow="hidden"
                          flexShrink={0}
                        >
                          <Image
                            src={item.image}
                            alt={item.title}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        </Box>
                      )}

                      {/* Details */}
                      <VStack align="start" flex={1} gap={2} w="100%">
                        <Text fontWeight="bold" color="black" fontSize="lg">
                          {item.title}
                        </Text>
                        <Text color="gray.600" fontSize="sm">
                          سعر الوحدة: {formatPrice(item.price)}
                        </Text>

                        {/* Quantity Controls */}
                        <HStack gap={2}>
                          <Text fontSize="sm" color="gray.600">
                            الكمية:
                          </Text>
                          <HStack
                            borderWidth={1}
                            borderColor="black"
                            borderRadius="md"
                            overflow="hidden"
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              borderRadius="0"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity - 1
                                )
                              }
                              minW="32px"
                            >
                              −
                            </Button>
                            <Text
                              px={3}
                              fontWeight="bold"
                              color="black"
                              fontSize="sm"
                            >
                              {item.quantity}
                            </Text>
                            <Button
                              size="sm"
                              variant="ghost"
                              borderRadius="0"
                              onClick={() =>
                                updateQuantity(
                                  item.productId,
                                  item.quantity + 1
                                )
                              }
                              minW="32px"
                            >
                              +
                            </Button>
                          </HStack>
                        </HStack>
                      </VStack>

                      {/* Price + Remove */}
                      <VStack align="end" gap={2} flexShrink={0}>
                        <Text fontWeight="bold" color="black" fontSize="lg">
                          {formatPrice(item.price * item.quantity)}
                        </Text>
                        <Button
                          size="sm"
                          variant="ghost"
                          color="red.500"
                          _hover={{ bg: 'red.50' }}
                          onClick={() => removeItem(item.productId)}
                        >
                          🗑 حذف
                        </Button>
                      </VStack>
                    </HStack>
                  </Box>
                ))}
              </VStack>

              {/* Summary */}
              <Box
                borderWidth={2}
                borderColor="black"
                borderRadius="lg"
                p={6}
                bg="white"
                boxShadow="4px 4px 0 0 black"
              >
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Text color="gray.600">
                      عدد المنتجات
                    </Text>
                    <Text fontWeight="bold" color="black">
                      {items.reduce((a, i) => a + i.quantity, 0)} قطعة
                    </Text>
                  </HStack>
                  <Box borderTopWidth={1} borderColor="gray.200" />
                  <HStack justify="space-between">
                    <Text fontSize="xl" fontWeight="bold" color="black">
                      المجموع الكلي
                    </Text>
                    <Text fontSize="xl" fontWeight="bold" color="black">
                      {formatPrice(total)}
                    </Text>
                  </HStack>

                  <Button
                    w="100%"
                    size="lg"
                    bg="black"
                    color="white"
                    _hover={{ bg: 'gray.800' }}
                    fontSize="lg"
                  >
                    إتمام الشراء
                  </Button>
                  <HStack justify="space-between">
                    <Link href="/products">
                      <Button variant="outline" borderColor="black" color="black">
                        متابعة التسوق
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      color="red.500"
                      _hover={{ bg: 'red.50' }}
                      onClick={clearCart}
                    >
                      تفريغ السلة
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            </>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
