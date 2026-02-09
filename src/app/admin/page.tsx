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
  Input,
  Textarea,
  Stack,
  Tabs,
} from '@chakra-ui/react';

interface Overview {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
  pendingReviews: number;
  openDisputes: number;
  pendingReports: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // New category form
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [overviewRes, usersRes, categoriesRes] = await Promise.all([
        fetch('/api/admin/overview'),
        fetch('/api/admin/users'),
        fetch('/api/admin/categories'),
      ]);

      const overviewData = await overviewRes.json();
      const usersData = await usersRes.json();
      const categoriesData = await categoriesRes.json();

      if (overviewData.success) setOverview(overviewData.data);
      if (usersData.success) setUsers(usersData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      const data = await res.json();
      if (data.success) {
        setCategories([data.data, ...categories]);
        setShowCategoryForm(false);
        setNewCategory({ name: '', description: '' });
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleUpdateUserStatus = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleRecomputeRanking = async () => {
    try {
      const res = await fetch('/api/admin/ranking/recompute', { method: 'PATCH' });
      const data = await res.json();
      if (data.success) {
        alert(`تم تحديث ترتيب ${data.data.updatedCount} منتج`);
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
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

  const roleLabels: Record<string, string> = {
    CUSTOMER: 'عميل',
    SELLER: 'بائع',
    ADMIN: 'مشرف',
  };

  const statusLabels: Record<string, string> = {
    ACTIVE: 'نشط',
    SUSPENDED: 'موقوف',
    BANNED: 'محظور',
  };

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between">
            <VStack align="start" gap={1}>
              <Heading size="xl" color="black">
                لوحة تحكم المشرف
              </Heading>
              <Text color="gray.600">مرحباً {session?.user?.name}</Text>
            </VStack>
            <Button
              bg="black"
              color="white"
              _hover={{ bg: 'gray.800' }}
              onClick={handleRecomputeRanking}
            >
              تحديث الترتيب
            </Button>
          </HStack>

          {/* Tabs */}
          <HStack gap={2} flexWrap="wrap">
            {['overview', 'users', 'categories'].map((tab) => (
              <Button
                key={tab}
                size="sm"
                bg={activeTab === tab ? 'black' : 'white'}
                color={activeTab === tab ? 'white' : 'black'}
                borderWidth={2}
                borderColor="black"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? 'نظرة عامة' : tab === 'users' ? 'المستخدمين' : 'الفئات'}
              </Button>
            ))}
          </HStack>

          {/* Overview Tab */}
          {activeTab === 'overview' && overview && (
            <VStack gap={6} align="stretch">
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <Box className="neon-card" p={6} textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color="black">
                    {overview.totalUsers}
                  </Text>
                  <Text color="gray.600">المستخدمين</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color="black">
                    {overview.totalSellers}
                  </Text>
                  <Text color="gray.600">البائعين</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color="black">
                    {overview.totalProducts}
                  </Text>
                  <Text color="gray.600">المنتجات</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center">
                  <Text fontSize="3xl" fontWeight="bold" color="black">
                    {overview.totalOrders}
                  </Text>
                  <Text color="gray.600">الطلبات</Text>
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <Box className="neon-card" p={6} textAlign="center" bg="yellow.50">
                  <Text fontSize="2xl" fontWeight="bold" color="yellow.700">
                    {overview.pendingProducts}
                  </Text>
                  <Text color="yellow.600">منتجات قيد المراجعة</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center" bg="blue.50">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.700">
                    {overview.pendingReviews}
                  </Text>
                  <Text color="blue.600">تقييمات قيد المراجعة</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center" bg="red.50">
                  <Text fontSize="2xl" fontWeight="bold" color="red.700">
                    {overview.openDisputes}
                  </Text>
                  <Text color="red.600">نزاعات مفتوحة</Text>
                </Box>
                <Box className="neon-card" p={6} textAlign="center" bg="orange.50">
                  <Text fontSize="2xl" fontWeight="bold" color="orange.700">
                    {overview.pendingReports}
                  </Text>
                  <Text color="orange.600">بلاغات معلقة</Text>
                </Box>
              </SimpleGrid>

              <Box className="neon-card" p={6}>
                <VStack align="start" gap={2}>
                  <Text fontWeight="bold" color="black" fontSize="lg">إجمالي الإيرادات</Text>
                  <Text fontSize="4xl" fontWeight="bold" color="black">
                    {overview.totalRevenue.toLocaleString()} ل.س
                  </Text>
                </VStack>
              </Box>
            </VStack>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <VStack gap={4} align="stretch">
              <Heading size="md" color="black">المستخدمين ({users.length})</Heading>
              {users.map((user) => (
                <Box key={user.id} className="neon-card" p={4}>
                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                    <VStack align="start" gap={1}>
                      <HStack>
                        <Text fontWeight="bold" color="black">{user.name}</Text>
                        <Badge colorPalette={user.role === 'ADMIN' ? 'purple' : user.role === 'SELLER' ? 'blue' : 'gray'}>
                          {roleLabels[user.role] || user.role}
                        </Badge>
                        <Badge colorPalette={user.status === 'ACTIVE' ? 'green' : 'red'}>
                          {statusLabels[user.status] || user.status}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">{user.email}</Text>
                      <Text fontSize="xs" color="gray.500">
                        انضم: {new Date(user.createdAt).toLocaleDateString('ar-SY')}
                      </Text>
                    </VStack>
                    <HStack gap={2}>
                      {user.status === 'ACTIVE' && user.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          colorPalette="yellow"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, 'SUSPENDED')}
                        >
                          إيقاف
                        </Button>
                      )}
                      {user.status === 'SUSPENDED' && (
                        <Button
                          size="sm"
                          colorPalette="green"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, 'ACTIVE')}
                        >
                          تفعيل
                        </Button>
                      )}
                      {user.status !== 'BANNED' && user.role !== 'ADMIN' && (
                        <Button
                          size="sm"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => handleUpdateUserStatus(user.id, 'BANNED')}
                        >
                          حظر
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <VStack gap={4} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="black">الفئات ({categories.length})</Heading>
                <Button
                  size="sm"
                  bg="black"
                  color="white"
                  _hover={{ bg: 'gray.800' }}
                  onClick={() => setShowCategoryForm(true)}
                >
                  + فئة جديدة
                </Button>
              </HStack>

              {showCategoryForm && (
                <Box
                  p={4}
                  borderWidth={2}
                  borderColor="black"
                  borderRadius="xl"
                  boxShadow="4px 4px 0 0 black"
                >
                  <Box as="form" onSubmit={handleCreateCategory}>
                    <Stack gap={4}>
                      <Stack gap={2}>
                        <Text fontWeight="bold">اسم الفئة</Text>
                        <Input
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                          borderWidth={2}
                          borderColor="black"
                          required
                        />
                      </Stack>
                      <Stack gap={2}>
                        <Text fontWeight="bold">وصف الفئة (اختياري)</Text>
                        <Textarea
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                          borderWidth={2}
                          borderColor="black"
                        />
                      </Stack>
                      <HStack>
                        <Button type="submit" bg="black" color="white">
                          إنشاء
                        </Button>
                        <Button variant="ghost" onClick={() => setShowCategoryForm(false)}>
                          إلغاء
                        </Button>
                      </HStack>
                    </Stack>
                  </Box>
                </Box>
              )}

              <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
                {categories.map((category) => (
                  <Box key={category.id} className="neon-card" p={4}>
                    <VStack align="start" gap={2}>
                      <Text fontWeight="bold" color="black">{category.name}</Text>
                      <Text fontSize="sm" color="gray.600">
                        {category._count.products} منتج
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        /{category.slug}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
