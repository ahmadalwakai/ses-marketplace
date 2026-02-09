'use client';

import { useEffect, useState, useCallback } from 'react';
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
  Switch,
} from '@chakra-ui/react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  body?: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

interface FeatureFlags {
  sesLive?: boolean;
  saved?: boolean;
  smallBusiness?: boolean;
  advancedSearch?: boolean;
  cookieConsent?: boolean;
  maxUploadSizeMb?: number;
  allowedMimes?: string[];
  [key: string]: unknown;
}

interface OverviewData {
  users: { total: number; byRole: Record<string, number>; byStatus: Record<string, number> };
  products: { total: number; byStatus: Record<string, number> };
  orders: { total: number; totalRevenue: number; totalCommission: number; byStatus: Record<string, number> };
  disputes: { total: number; byStatus: Record<string, number> };
  reports: { total: number; byStatus: Record<string, number> };
  featureFlags: FeatureFlags;
  unreadNotifications: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({});
  const [loading, setLoading] = useState(true);
  const [savingFlags, setSavingFlags] = useState(false);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/overview');
      const data = await res.json();
      if (data.ok) {
        setOverview(data.data);
        setFeatureFlags(data.data.featureFlags || {});
        setUnreadCount(data.data.unreadNotifications || 0);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/admin?limit=15');
      const data = await res.json();
      if (data.ok) {
        setNotifications(data.data.items || []);
        setUnreadCount(data.data.unreadCount ?? 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      Promise.all([fetchOverview(), fetchNotifications()]).finally(() => setLoading(false));
    }
  }, [status, fetchOverview, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications/admin/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      const data = await res.json();
      if (data.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      console.error('Error marking all read');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch('/api/notifications/admin/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      console.error('Error marking notification read');
    }
  };

  const handleToggleFlag = async (key: string, value: boolean) => {
    const newFlags = { ...featureFlags, [key]: value };
    setFeatureFlags(newFlags);
    setSavingFlags(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureFlags: { [key]: value } }),
      });
      const data = await res.json();
      if (!data.ok) {
        setFeatureFlags((prev) => ({ ...prev, [key]: !value }));
        alert('فشل حفظ الإعداد');
      }
    } catch {
      setFeatureFlags((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingFlags(false);
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

  if (status === 'unauthenticated' || session?.user?.role !== 'ADMIN') {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={4}>
            <Heading color="black">غير مصرح لك</Heading>
            <Text color="gray.600">هذه الصفحة للمشرفين فقط</Text>
            <Link href="/">
              <Button bg="black" color="white">العودة للرئيسية</Button>
            </Link>
          </VStack>
        </Container>
      </Box>
    );
  }

  const flagToggles: { key: string; label: string; desc: string }[] = [
    { key: 'sesLive', label: 'SES Live', desc: 'تفعيل ميزة البث المباشر' },
    { key: 'saved', label: 'المحفوظات', desc: 'تفعيل قائمة المحفوظات' },
    { key: 'smallBusiness', label: 'الأعمال الصغيرة', desc: 'صفحة الأعمال الصغيرة' },
    { key: 'advancedSearch', label: 'بحث متقدم', desc: 'تفعيل البحث المتقدم بالفلاتر' },
    { key: 'cookieConsent', label: 'إشعار الكوكيز', desc: 'إظهار لوح موافقة الكوكيز' },
  ];

  const typeLabels: Record<string, string> = {
    NEW_SIGNUP: 'تسجيل جديد',
    PRODUCT_PENDING: 'منتج قيد المراجعة',
    REPORT_CREATED: 'بلاغ جديد',
    DISPUTE_OPENED: 'نزاع مفتوح',
    DISPUTE_MESSAGE: 'رسالة نزاع',
    ORDER_CREATED: 'طلب جديد',
    SELLER_VERIFICATION: 'توثيق بائع',
    SETTINGS_CHANGED: 'تغيير إعدادات',
    DISPUTE_RESOLVED: 'نزاع محلول',
  };

  const typeBadgeColor: Record<string, string> = {
    NEW_SIGNUP: 'green',
    PRODUCT_PENDING: 'yellow',
    REPORT_CREATED: 'red',
    DISPUTE_OPENED: 'orange',
    DISPUTE_MESSAGE: 'orange',
    ORDER_CREATED: 'blue',
    SELLER_VERIFICATION: 'purple',
    SETTINGS_CHANGED: 'cyan',
  };

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">
                لوحة تحكم المشرف
              </Heading>
              <Text color="gray.600">مرحباً {session?.user?.name}</Text>
            </VStack>
            <HStack gap={2}>
              <Link href="/admin/settings">
                <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                  الإعدادات
                </Button>
              </Link>
              <Link href="/admin">
                <Button variant="outline" borderColor="black" color="black">
                  الإدارة الكاملة
                </Button>
              </Link>
            </HStack>
          </HStack>

          {/* Stats Overview */}
          {overview && (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              <Box className="neon-card" p={6} textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="black">{overview.users.total}</Text>
                <Text color="gray.600">المستخدمين</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="black">{overview.products.total}</Text>
                <Text color="gray.600">المنتجات</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center">
                <Text fontSize="3xl" fontWeight="bold" color="black">{overview.orders.total}</Text>
                <Text color="gray.600">الطلبات</Text>
              </Box>
              <Box className="neon-card" p={6} textAlign="center" bg={unreadCount > 0 ? 'red.50' : undefined}>
                <Text fontSize="3xl" fontWeight="bold" color={unreadCount > 0 ? 'red.600' : 'black'}>
                  {unreadCount}
                </Text>
                <Text color="gray.600">إشعارات غير مقروءة</Text>
              </Box>
            </SimpleGrid>
          )}

          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            {/* Feature Flags Quick Toggles */}
            <Box className="neon-card" p={6}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Heading size="md" color="black">أعلام الميزات</Heading>
                  {savingFlags && <Spinner size="sm" />}
                </HStack>

                {flagToggles.map(({ key, label, desc }) => (
                  <HStack key={key} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                    <VStack align="start" gap={0}>
                      <Text fontWeight="bold" fontSize="sm">{label}</Text>
                      <Text fontSize="xs" color="gray.500">{desc}</Text>
                    </VStack>
                    <Switch.Root
                      checked={!!featureFlags[key]}
                      onCheckedChange={(details) => handleToggleFlag(key, details.checked)}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch.Root>
                  </HStack>
                ))}

                <Link href="/admin/settings">
                  <Button size="sm" variant="outline" borderColor="black" color="black" w="full">
                    جميع الإعدادات
                  </Button>
                </Link>
              </VStack>
            </Box>

            {/* Notification Feed */}
            <Box className="neon-card" p={6}>
              <VStack align="stretch" gap={4}>
                <HStack justify="space-between">
                  <Heading size="md" color="black">
                    الإشعارات {unreadCount > 0 && <Badge colorPalette="red">{unreadCount}</Badge>}
                  </Heading>
                  {unreadCount > 0 && (
                    <Button size="xs" variant="ghost" onClick={handleMarkAllRead}>
                      تحديد الكل كمقروء
                    </Button>
                  )}
                </HStack>

                {notifications.length === 0 ? (
                  <Text color="gray.500" textAlign="center" py={4}>لا توجد إشعارات</Text>
                ) : (
                  <VStack align="stretch" gap={2} maxH="500px" overflowY="auto">
                    {notifications.map((n) => (
                      <Box
                        key={n.id}
                        p={3}
                        bg={n.isRead ? 'white' : 'blue.50'}
                        borderRadius="lg"
                        borderWidth={1}
                        borderColor={n.isRead ? 'gray.100' : 'blue.200'}
                        cursor="pointer"
                        _hover={{ bg: n.isRead ? 'gray.50' : 'blue.100' }}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                      >
                        <HStack justify="space-between" mb={1}>
                          <HStack gap={2}>
                            <Badge
                              colorPalette={typeBadgeColor[n.type] || 'gray'}
                              fontSize="xs"
                            >
                              {typeLabels[n.type] || n.type}
                            </Badge>
                            {!n.isRead && (
                              <Box w={2} h={2} borderRadius="full" bg="blue.500" />
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(n.createdAt).toLocaleString('ar-SY')}
                          </Text>
                        </HStack>
                        <Text fontWeight="bold" fontSize="sm" color="black">
                          {n.title}
                        </Text>
                        <Text fontSize="xs" color="gray.600">
                          {n.body || n.message}
                        </Text>
                        {n.entityType && (
                          <Text fontSize="xs" color="gray.400" mt={1}>
                            {n.entityType} #{n.entityId?.slice(-8)}
                          </Text>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>
          </SimpleGrid>

          {/* Quick Action Cards */}
          {overview && (
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
              <Box className="neon-card" p={4} textAlign="center" bg="yellow.50">
                <Text fontSize="xl" fontWeight="bold" color="yellow.700">
                  {overview.products.byStatus?.PENDING || 0}
                </Text>
                <Text fontSize="sm" color="yellow.600">منتجات قيد المراجعة</Text>
              </Box>
              <Box className="neon-card" p={4} textAlign="center" bg="red.50">
                <Text fontSize="xl" fontWeight="bold" color="red.700">
                  {overview.disputes.byStatus?.OPEN || 0}
                </Text>
                <Text fontSize="sm" color="red.600">نزاعات مفتوحة</Text>
              </Box>
              <Box className="neon-card" p={4} textAlign="center" bg="orange.50">
                <Text fontSize="xl" fontWeight="bold" color="orange.700">
                  {overview.reports.byStatus?.PENDING || 0}
                </Text>
                <Text fontSize="sm" color="orange.600">بلاغات معلقة</Text>
              </Box>
              <Box className="neon-card" p={4} textAlign="center" bg="green.50">
                <Text fontSize="xl" fontWeight="bold" color="green.700">
                  {overview.orders.totalRevenue?.toLocaleString() || 0}
                </Text>
                <Text fontSize="sm" color="green.600">إجمالي الإيرادات</Text>
              </Box>
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
