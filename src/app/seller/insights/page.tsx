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

interface ProductInsight {
  id: string;
  title: string;
  slug: string;
  price: number;
  quantity: number;
  status: string;
  views: number;
  addToCarts: number;
  orders: number;
  createdAt: string;
}

interface InsightsData {
  period: number;
  summary: {
    totalProducts: number;
    activeProducts: number;
    totalViews: number;
    totalAddToCarts: number;
    totalOrders: number;
    ordersInPeriod: number;
    revenue: number;
    conversionRate: number;
    orderRate: number;
    lowStockCount: number;
    lowStockThreshold: number;
  };
  ordersByStatus: { status: string; count: number }[];
  topByViews: { id: string; title: string; slug: string; views: number }[];
  topByAddToCart: { id: string; title: string; slug: string; addToCarts: number }[];
  topByOrders: { id: string; title: string; slug: string; orders: number }[];
  lowStockProducts: { id: string; title: string; slug: string; quantity: number }[];
  products: ProductInsight[];
}

const orderStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PACKING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
  DISPUTED: 'نزاع',
  RESOLVED: 'تمت التسوية',
};

export default function SellerInsightsPage() {
  const { status } = useSession();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState(30);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchInsights();
    }
  }, [status, period]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/insights?period=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
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
          <VStack gap={4} textAlign="center">
            <Heading color="black">يرجى تسجيل الدخول</Heading>
            <Link href="/auth/login">
              <Button bg="black" color="white">تسجيل الدخول</Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={4} textAlign="center">
            <Heading color="black">لا توجد بيانات</Heading>
            <Link href="/seller/dashboard">
              <Button bg="black" color="white">العودة للوحة التحكم</Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  return (
    <Box minH="100vh" bg="white" py={6}>
      <Container maxW="7xl">
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">
                إحصائيات المتجر
              </Heading>
              <Text color="gray.600">
                تتبع أداء منتجاتك ومبيعاتك
              </Text>
            </VStack>
            <HStack gap={2}>
              {[7, 30, 90].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={period === d ? 'solid' : 'outline'}
                  bg={period === d ? 'black' : 'white'}
                  color={period === d ? 'white' : 'black'}
                  borderColor="black"
                  onClick={() => setPeriod(d)}
                  _hover={{ bg: period === d ? 'gray.800' : 'gray.100' }}
                >
                  {d} يوم
                </Button>
              ))}
            </HStack>
          </HStack>

          {/* Summary Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">المشاهدات</Text>
              <Text fontSize="2xl" fontWeight="bold" color="black" mt={1}>
                {data.summary.totalViews.toLocaleString()}
              </Text>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">إضافة للسلة</Text>
              <Text fontSize="2xl" fontWeight="bold" color="black" mt={1}>
                {data.summary.totalAddToCarts.toLocaleString()}
              </Text>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">الطلبات ({period} يوم)</Text>
              <Text fontSize="2xl" fontWeight="bold" color="black" mt={1}>
                {data.summary.ordersInPeriod.toLocaleString()}
              </Text>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">الإيرادات ({period} يوم)</Text>
              <Text fontSize="2xl" fontWeight="bold" color="black" mt={1}>
                {data.summary.revenue.toLocaleString()} ل.س
              </Text>
            </Box>
          </SimpleGrid>

          {/* Conversion Rates */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text fontWeight="bold" color="black" mb={3}>
                معدلات التحويل
              </Text>
              <SimpleGrid columns={2} gap={4}>
                <VStack align="start" gap={0}>
                  <Text color="gray.600" fontSize="sm">مشاهدة → سلة</Text>
                  <Text fontSize="xl" fontWeight="bold" color="blue.600">
                    {data.summary.conversionRate}%
                  </Text>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text color="gray.600" fontSize="sm">سلة → طلب</Text>
                  <Text fontSize="xl" fontWeight="bold" color="green.600">
                    {data.summary.orderRate}%
                  </Text>
                </VStack>
              </SimpleGrid>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text fontWeight="bold" color="black" mb={3}>
                حالة الطلبات ({period} يوم)
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {data.ordersByStatus.map((s) => (
                  <Badge key={s.status} px={3} py={1}>
                    {orderStatusLabels[s.status] || s.status}: {s.count}
                  </Badge>
                ))}
              </HStack>
            </Box>
          </SimpleGrid>

          {/* Top Products */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            {/* Top by Views */}
            <Box
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
              overflow="hidden"
            >
              <Box p={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                <HStack gap={2}>
                  <Text>👁</Text>
                  <Text fontWeight="bold" color="black">الأكثر مشاهدة</Text>
                </HStack>
              </Box>
              <VStack align="stretch" p={3} gap={2}>
                {data.topByViews.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">لا توجد بيانات</Text>
                ) : (
                  data.topByViews.map((p, i) => (
                    <HStack key={p.id} justify="space-between">
                      <HStack gap={2}>
                        <Text fontWeight="bold" color="gray.400">{i + 1}.</Text>
                        <Link href={`/products/${p.slug}`}>
                          <Text
                            fontSize="sm"
                            color="black"
                            _hover={{ textDecoration: 'underline' }}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            maxW="150px"
                          >
                            {p.title}
                          </Text>
                        </Link>
                      </HStack>
                      <Badge>{p.views}</Badge>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>

            {/* Top by Add to Cart */}
            <Box
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
              overflow="hidden"
            >
              <Box p={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                <HStack gap={2}>
                  <Text>🛒</Text>
                  <Text fontWeight="bold" color="black">الأكثر إضافة للسلة</Text>
                </HStack>
              </Box>
              <VStack align="stretch" p={3} gap={2}>
                {data.topByAddToCart.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">لا توجد بيانات</Text>
                ) : (
                  data.topByAddToCart.map((p, i) => (
                    <HStack key={p.id} justify="space-between">
                      <HStack gap={2}>
                        <Text fontWeight="bold" color="gray.400">{i + 1}.</Text>
                        <Link href={`/products/${p.slug}`}>
                          <Text
                            fontSize="sm"
                            color="black"
                            _hover={{ textDecoration: 'underline' }}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            maxW="150px"
                          >
                            {p.title}
                          </Text>
                        </Link>
                      </HStack>
                      <Badge colorPalette="blue">{p.addToCarts}</Badge>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>

            {/* Top by Orders */}
            <Box
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
              overflow="hidden"
            >
              <Box p={3} bg="gray.50" borderBottom="1px solid" borderColor="gray.200">
                <HStack gap={2}>
                  <Text>📦</Text>
                  <Text fontWeight="bold" color="black">الأكثر طلباً</Text>
                </HStack>
              </Box>
              <VStack align="stretch" p={3} gap={2}>
                {data.topByOrders.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">لا توجد بيانات</Text>
                ) : (
                  data.topByOrders.map((p, i) => (
                    <HStack key={p.id} justify="space-between">
                      <HStack gap={2}>
                        <Text fontWeight="bold" color="gray.400">{i + 1}.</Text>
                        <Link href={`/products/${p.slug}`}>
                          <Text
                            fontSize="sm"
                            color="black"
                            _hover={{ textDecoration: 'underline' }}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            maxW="150px"
                          >
                            {p.title}
                          </Text>
                        </Link>
                      </HStack>
                      <Badge colorPalette="green">{p.orders}</Badge>
                    </HStack>
                  ))
                )}
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Low Stock Alert */}
          {data.lowStockProducts.length > 0 && (
            <Box
              borderWidth={2}
              borderColor="orange.400"
              borderRadius="xl"
              bg="orange.50"
              overflow="hidden"
            >
              <Box p={3} borderBottom="1px solid" borderColor="orange.200">
                <HStack gap={2}>
                  <Text>⚠️</Text>
                  <Text fontWeight="bold" color="orange.700">
                    منتجات منخفضة المخزون (≤ {data.summary.lowStockThreshold})
                  </Text>
                </HStack>
              </Box>
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={3} p={4}>
                {data.lowStockProducts.map((p) => (
                  <HStack
                    key={p.id}
                    justify="space-between"
                    p={2}
                    bg="white"
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="orange.200"
                  >
                    <Link href={`/products/${p.slug}`}>
                      <Text
                        fontSize="sm"
                        _hover={{ textDecoration: 'underline' }}
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        maxW="120px"
                      >
                        {p.title}
                      </Text>
                    </Link>
                    <Badge colorPalette="orange">{p.quantity}</Badge>
                  </HStack>
                ))}
              </SimpleGrid>
            </Box>
          )}

          {/* All Products Table */}
          <Box
            borderWidth={2}
            borderColor="black"
            borderRadius="xl"
            boxShadow="4px 4px 0 0 black"
            overflow="hidden"
          >
            <HStack
              justify="space-between"
              p={4}
              borderBottom="1px solid"
              borderColor="gray.200"
            >
              <Heading size="md" color="black">
                جميع المنتجات ({data.products.length})
              </Heading>
              <Link href="/seller/products">
                <Button size="sm" variant="ghost" color="black">
                  إدارة المنتجات →
                </Button>
              </Link>
            </HStack>

            <Box overflowX="auto">
              <Box as="table" w="full" fontSize="sm">
                <Box as="thead" bg="gray.50">
                  <Box as="tr">
                    <Box as="th" p={3} textAlign="right">المنتج</Box>
                    <Box as="th" p={3} textAlign="center">الحالة</Box>
                    <Box as="th" p={3} textAlign="center">السعر</Box>
                    <Box as="th" p={3} textAlign="center">المخزون</Box>
                    <Box as="th" p={3} textAlign="center">👁</Box>
                    <Box as="th" p={3} textAlign="center">🛒</Box>
                    <Box as="th" p={3} textAlign="center">📦</Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {data.products.map((p) => (
                    <Box
                      as="tr"
                      key={p.id}
                      borderTop="1px solid"
                      borderColor="gray.100"
                      _hover={{ bg: 'gray.50' }}
                    >
                      <Box as="td" p={3}>
                        <Link href={`/products/${p.slug}`}>
                          <Text
                            fontWeight="medium"
                            _hover={{ textDecoration: 'underline' }}
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            maxW="200px"
                          >
                            {p.title}
                          </Text>
                        </Link>
                      </Box>
                      <Box as="td" p={3} textAlign="center">
                        <Badge
                          colorPalette={
                            p.status === 'ACTIVE' ? 'green' :
                            p.status === 'PENDING' ? 'yellow' :
                            p.status === 'PAUSED' ? 'orange' : 'gray'
                          }
                          size="sm"
                        >
                          {p.status}
                        </Badge>
                      </Box>
                      <Box as="td" p={3} textAlign="center">
                        {p.price.toLocaleString()}
                      </Box>
                      <Box
                        as="td"
                        p={3}
                        textAlign="center"
                        color={p.quantity <= data.summary.lowStockThreshold ? 'orange.600' : 'inherit'}
                        fontWeight={p.quantity <= data.summary.lowStockThreshold ? 'bold' : 'normal'}
                      >
                        {p.quantity}
                      </Box>
                      <Box as="td" p={3} textAlign="center">{p.views}</Box>
                      <Box as="td" p={3} textAlign="center">{p.addToCarts}</Box>
                      <Box as="td" p={3} textAlign="center">{p.orders}</Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </VStack>
      </Container>
    </Box>
  );
}
