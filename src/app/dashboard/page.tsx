'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Badge,
  Spinner,
  Button,
} from '@chakra-ui/react';

interface Order {
  id: string;
  status: string;
  total: number;
  shippingAddress: string;
  createdAt: string;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      title: string;
      slug: string;
    };
  }[];
}

const statusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

const statusColors: Record<string, string> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

export default function CustomerDashboardPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders/me');
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
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

  if (status === 'unauthenticated') {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={4}>
            <Heading color="black">يرجى تسجيل الدخول</Heading>
            <Link href="/auth/login">
              <Button bg="black" color="white">تسجيل الدخول</Button>
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
          <HStack justify="space-between">
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">
                مرحباً {session?.user?.name}
              </Heading>
              <Text color="gray.600">لوحة تحكم العميل</Text>
            </VStack>
            <Link href="/products">
              <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                تصفح المنتجات
              </Button>
            </Link>
          </HStack>

          {/* Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {orders.length}
              </Text>
              <Text color="gray.600">إجمالي الطلبات</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {orders.filter(o => o.status === 'PENDING').length}
              </Text>
              <Text color="gray.600">قيد الانتظار</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {orders.filter(o => o.status === 'SHIPPED').length}
              </Text>
              <Text color="gray.600">في الطريق</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {orders.filter(o => o.status === 'DELIVERED').length}
              </Text>
              <Text color="gray.600">تم التوصيل</Text>
            </Box>
          </SimpleGrid>

          {/* Orders */}
          <Box>
            <Heading size="lg" color="black" mb={4}>
              طلباتي
            </Heading>
            {orders.length === 0 ? (
              <Box className="neon-card" p={8} textAlign="center">
                <Text color="gray.600">لا توجد طلبات بعد</Text>
                <Link href="/products">
                  <Button mt={4} bg="black" color="white">
                    ابدأ التسوق
                  </Button>
                </Link>
              </Box>
            ) : (
              <VStack gap={4} align="stretch">
                {orders.map((order) => (
                  <Box key={order.id} className="neon-card" p={6}>
                    <HStack justify="space-between" mb={4}>
                      <VStack align="start" gap={1}>
                        <Text fontWeight="bold" color="black">
                          طلب #{order.id.slice(-8)}
                        </Text>
                        <Text fontSize="sm" color="gray.500">
                          {new Date(order.createdAt).toLocaleDateString('ar-SY', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Text>
                      </VStack>
                      <Badge
                        colorPalette={statusColors[order.status]}
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </HStack>
                    
                    <VStack align="stretch" gap={2} mb={4}>
                      {order.items.map((item) => (
                        <HStack key={item.id} justify="space-between">
                          <Text color="gray.700">
                            {item.product.title} × {item.quantity}
                          </Text>
                          <Text fontWeight="bold" color="black">
                            {(item.price * item.quantity).toLocaleString()} ل.س
                          </Text>
                        </HStack>
                      ))}
                    </VStack>

                    <HStack justify="space-between" pt={4} borderTopWidth={1}>
                      <Text color="gray.600" fontSize="sm">
                        التوصيل: {order.shippingAddress}
                      </Text>
                      <Text fontWeight="bold" fontSize="lg" color="black">
                        الإجمالي: {order.total.toLocaleString()} ل.س
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
