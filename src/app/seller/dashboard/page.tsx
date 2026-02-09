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

interface SellerProfile {
  id: string;
  storeName: string;
  slug: string;
  bio: string | null;
  verificationStatus: string;
  ratingAvg: number;
  ratingCount: number;
  lowStockThreshold: number;
}

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalEarnings: number;
  pendingEarnings: number;
  lowStockCount: number;
}

interface RecentOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { name: string };
}

const statusLabels: Record<string, string> = {
  PENDING: 'معلق',
  APPROVED: 'موثق',
  REJECTED: 'مرفوض',
};

const orderStatusLabels: Record<string, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  PACKING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التوصيل',
  CANCELLED: 'ملغي',
};

const orderStatusColors: Record<string, string> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  PACKING: 'purple',
  SHIPPED: 'cyan',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [profileRes, ordersRes, earningsRes, insightsRes] = await Promise.all([
        fetch('/api/seller/me'),
        fetch('/api/seller/orders?limit=5'),
        fetch('/api/seller/earnings'),
        fetch('/api/seller/insights?period=30'),
      ]);

      const profileData = await profileRes.json();
      const ordersData = await ordersRes.json();
      const earningsData = await earningsRes.json();
      const insightsData = await insightsRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }

      if (ordersData.success) {
        setRecentOrders(ordersData.data?.slice(0, 5) || []);
      }

      // Combine stats from earnings and insights
      setStats({
        totalProducts: insightsData.success ? insightsData.data.summary.totalProducts : 0,
        activeProducts: insightsData.success ? insightsData.data.summary.activeProducts : 0,
        totalOrders: earningsData.success ? earningsData.data.totalOrders : 0,
        pendingOrders: ordersData.success
          ? (ordersData.data || []).filter((o: RecentOrder) => o.status === 'PENDING').length
          : 0,
        totalEarnings: earningsData.success ? earningsData.data.totalEarnings : 0,
        pendingEarnings: earningsData.success ? earningsData.data.pendingEarnings : 0,
        lowStockCount: insightsData.success ? insightsData.data.summary.lowStockCount : 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  return (
    <Box minH="100vh" bg="white" py={6}>
      <Container maxW="7xl">
        <VStack gap={6} align="stretch">
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">
                لوحة التحكم
              </Heading>
              <HStack gap={2}>
                <Text color="gray.600">
                  مرحباً، {profile?.storeName || session?.user?.name}
                </Text>
                {profile && (
                  <Badge
                    colorPalette={
                      profile.verificationStatus === 'APPROVED'
                        ? 'green'
                        : profile.verificationStatus === 'REJECTED'
                        ? 'red'
                        : 'yellow'
                    }
                  >
                    {statusLabels[profile.verificationStatus]}
                  </Badge>
                )}
              </HStack>
            </VStack>
            <HStack gap={2}>
              <Link href="/seller/products/new">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                  + منتج جديد
                </Button>
              </Link>
            </HStack>
          </HStack>

          {/* Low Stock Alert */}
          {stats && stats.lowStockCount > 0 && (
            <Box
              p={4}
              borderWidth={2}
              borderColor="orange.400"
              borderRadius="xl"
              bg="orange.50"
            >
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <HStack gap={2}>
                  <Text fontSize="xl">⚠️</Text>
                  <Text fontWeight="bold" color="orange.700">
                    {stats.lowStockCount} منتجات تحتاج إعادة تعبئة المخزون
                  </Text>
                </HStack>
                <Link href="/seller/products">
                  <Button size="sm" variant="outline" borderColor="orange.400" color="orange.700">
                    عرض المنتجات
                  </Button>
                </Link>
              </HStack>
            </Box>
          )}

          {/* Stats Cards */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">إجمالي المنتجات</Text>
              <HStack align="baseline" mt={1}>
                <Text fontSize="2xl" fontWeight="bold" color="black">
                  {stats?.totalProducts || 0}
                </Text>
                <Text color="green.500" fontSize="sm">
                  ({stats?.activeProducts || 0} نشط)
                </Text>
              </HStack>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">الطلبات</Text>
              <HStack align="baseline" mt={1}>
                <Text fontSize="2xl" fontWeight="bold" color="black">
                  {stats?.totalOrders || 0}
                </Text>
                {stats?.pendingOrders ? (
                  <Text color="yellow.600" fontSize="sm">
                    ({stats.pendingOrders} معلق)
                  </Text>
                ) : null}
              </HStack>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">إجمالي الأرباح</Text>
              <Text fontSize="2xl" fontWeight="bold" color="black" mt={1}>
                {(stats?.totalEarnings || 0).toLocaleString()} ل.س
              </Text>
            </Box>

            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Text color="gray.600" fontSize="sm">أرباح معلقة</Text>
              <Text fontSize="2xl" fontWeight="bold" color="yellow.600" mt={1}>
                {(stats?.pendingEarnings || 0).toLocaleString()} ل.س
              </Text>
            </Box>
          </SimpleGrid>

          {/* Quick Links */}
          <SimpleGrid columns={{ base: 2, sm: 4 }} gap={4}>
            <Link href="/seller/products">
              <Box
                p={4}
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                boxShadow="4px 4px 0 0 black"
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <Text fontSize="2xl" mb={2}>📦</Text>
                <Text fontWeight="bold" color="black">منتجاتي</Text>
              </Box>
            </Link>

            <Link href="/seller/insights">
              <Box
                p={4}
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                boxShadow="4px 4px 0 0 black"
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <Text fontSize="2xl" mb={2}>📊</Text>
                <Text fontWeight="bold" color="black">الإحصائيات</Text>
              </Box>
            </Link>

            <Link href="/seller">
              <Box
                p={4}
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                boxShadow="4px 4px 0 0 black"
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <Text fontSize="2xl" mb={2}>📋</Text>
                <Text fontWeight="bold" color="black">الطلبات</Text>
              </Box>
            </Link>

            <Link href={`/stores/${profile?.slug || ''}`}>
              <Box
                p={4}
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                boxShadow="4px 4px 0 0 black"
                textAlign="center"
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ transform: 'translateY(-2px)' }}
              >
                <Text fontSize="2xl" mb={2}>🏪</Text>
                <Text fontWeight="bold" color="black">متجري</Text>
              </Box>
            </Link>
          </SimpleGrid>

          {/* Recent Orders */}
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
                أحدث الطلبات
              </Heading>
              <Link href="/seller">
                <Button size="sm" variant="ghost" color="black">
                  عرض الكل →
                </Button>
              </Link>
            </HStack>

            {recentOrders.length === 0 ? (
              <Box p={8} textAlign="center">
                <Text color="gray.500">لا توجد طلبات حتى الآن</Text>
              </Box>
            ) : (
              <VStack align="stretch" p={4} gap={3}>
                {recentOrders.map((order) => (
                  <HStack
                    key={order.id}
                    justify="space-between"
                    p={3}
                    bg="gray.50"
                    borderRadius="lg"
                    flexWrap="wrap"
                    gap={2}
                  >
                    <VStack align="start" gap={0}>
                      <Text fontWeight="medium" color="black">
                        {order.customer?.name || 'زبون'}
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(order.createdAt).toLocaleDateString('ar-SY')}
                      </Text>
                    </VStack>
                    <HStack gap={3}>
                      <Text fontWeight="bold">
                        {Number(order.total).toLocaleString()} ل.س
                      </Text>
                      <Badge colorPalette={orderStatusColors[order.status]}>
                        {orderStatusLabels[order.status]}
                      </Badge>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>

          {/* Store Rating */}
          {profile && (
            <Box
              p={4}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                <VStack align="start" gap={0}>
                  <Text color="gray.600" fontSize="sm">تقييم المتجر</Text>
                  <HStack>
                    <Text fontSize="2xl" fontWeight="bold" color="black">
                      {profile.ratingAvg.toFixed(1)}
                    </Text>
                    <Text color="yellow.500">★</Text>
                    <Text color="gray.500" fontSize="sm">
                      ({profile.ratingCount} تقييم)
                    </Text>
                  </HStack>
                </VStack>
                <VStack align="end" gap={0}>
                  <Text color="gray.600" fontSize="sm">حد تنبيه المخزون</Text>
                  <Text fontWeight="bold" color="black">
                    {profile.lowStockThreshold} وحدة
                  </Text>
                </VStack>
              </HStack>
            </Box>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
