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
  Table,
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

interface AdminSettings {
  freeMode: boolean;
  globalCommissionRate: number;
  rankingWeights: {
    w_recency: number;
    w_rating: number;
    w_orders: number;
    w_stock: number;
    w_sellerRep: number;
  };
}

interface CategoryCommission {
  id: string;
  categoryId: string;
  commissionRate: number;
  category: { id: string; name: string; nameAr?: string };
}

interface SellerCommission {
  id: string;
  sellerId: string;
  tier: string;
  commissionRate: number;
  notes?: string;
  seller: { id: string; storeName: string; user: { name: string; email: string } };
}

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  admin: { name: string; email: string };
}

interface ModerationData {
  counts: {
    pendingSellers: number;
    pendingReviews: number;
    pendingReports: number;
    pendingProducts: number;
    blockedProducts: number;
    total: number;
  };
  pendingSellers: Array<{
    id: string;
    storeName: string;
    slug: string;
    createdAt: string;
    user: { id: string; name: string; email: string };
  }>;
  pendingReviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    customer: { name: string };
    product: { title: string; slug: string };
  }>;
  pendingProducts: Array<{
    id: string;
    title: string;
    slug: string;
    price: number;
    createdAt: string;
    seller: { storeName: string };
  }>;
}

interface RankingProduct {
  id: string;
  title: string;
  slug: string;
  price: number;
  score: number;
  pinned: boolean;
  manualBoost: number;
  penaltyScore: number;
  ratingAvg: number;
  seller: { storeName: string };
  images: Array<{ url: string }>;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Settings state
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [categoryCommissions, setCategoryCommissions] = useState<CategoryCommission[]>([]);
  const [sellerCommissions, setSellerCommissions] = useState<SellerCommission[]>([]);

  // Moderation state
  const [moderation, setModeration] = useState<ModerationData | null>(null);

  // Ranking state
  const [rankingProducts, setRankingProducts] = useState<RankingProduct[]>([]);
  const [rankingStats, setRankingStats] = useState<{ pinnedCount: number; boostedCount: number; penalizedCount: number } | null>(null);

  // Admins state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [addAdminEmail, setAddAdminEmail] = useState('');
  const [addAdminLoading, setAddAdminLoading] = useState(false);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [adminsToast, setAdminsToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [analytics, setAnalytics] = useState<{ rangeDays: number; totals: { orders: number; gmv: number; newUsers: number; newSellers: number; newProducts: number; conversionRate: number; orderRate: number }; daily: { date: string; orders: number; gmv: number }[] } | null>(null);

  // New category form
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  useEffect(() => {
    if (activeTab === 'settings' && !settings) fetchSettings();
    if (activeTab === 'moderation' && !moderation) fetchModeration();
    if (activeTab === 'ranking' && rankingProducts.length === 0) fetchRanking();
    if (activeTab === 'admins' && adminUsers.length === 0) fetchAdmins();
    if (activeTab === 'audit' && auditLogs.length === 0) fetchAuditLogs();
    if (activeTab === 'analytics' && !analytics) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

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

  const fetchSettings = async () => {
    try {
      const [settingsRes, catCommRes, sellerCommRes] = await Promise.all([
        fetch('/api/admin/settings'),
        fetch('/api/admin/commission/categories'),
        fetch('/api/admin/commission/sellers'),
      ]);
      const settingsData = await settingsRes.json();
      const catCommData = await catCommRes.json();
      const sellerCommData = await sellerCommRes.json();

      if (settingsData.success) setSettings({
        freeMode: settingsData.data.freeMode,
        globalCommissionRate: Number(settingsData.data.globalCommissionRate),
        rankingWeights: settingsData.data.rankingWeights,
      });
      if (catCommData.success) setCategoryCommissions(catCommData.data);
      if (sellerCommData.success) setSellerCommissions(sellerCommData.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchModeration = async () => {
    try {
      const res = await fetch('/api/admin/moderation');
      const data = await res.json();
      if (data.success) setModeration(data.data);
    } catch (error) {
      console.error('Error fetching moderation:', error);
    }
  };

  const fetchRanking = async () => {
    try {
      const res = await fetch('/api/admin/ranking/products');
      const data = await res.json();
      if (data.success) {
        setRankingProducts(data.data.products);
        setRankingStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching ranking:', error);
    }
  };

  const fetchAdmins = async () => {
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (data.ok) setAdminUsers(data.data);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addAdminEmail.trim()) return;
    setAddAdminLoading(true);
    setAdminsToast(null);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: addAdminEmail.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        if (data.data.invited) {
          setAdminsToast({ type: 'success', message: `تم إرسال دعوة إلى ${data.data.email}` });
        } else {
          setAdminUsers((prev) => [data.data, ...prev.filter((a) => a.id !== data.data.id)]);
          setAdminsToast({ type: 'success', message: `تمت ترقية ${data.data.email} إلى مشرف` });
        }
        setAddAdminEmail('');
      } else {
        setAdminsToast({ type: 'error', message: data.error?.message || 'حدث خطأ' });
      }
    } catch {
      setAdminsToast({ type: 'error', message: 'حدث خطأ غير متوقع' });
    } finally {
      setAddAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    setAdminsToast(null);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setAdminUsers((prev) => prev.filter((a) => a.id !== userId));
        setAdminsToast({ type: 'success', message: 'تمت إزالة صلاحيات المشرف' });
      } else {
        setAdminsToast({ type: 'error', message: data.error?.message || 'حدث خطأ' });
      }
    } catch {
      setAdminsToast({ type: 'error', message: 'حدث خطأ غير متوقع' });
    } finally {
      setRemoveConfirmId(null);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit?page=${auditPage}&limit=30`);
      const data = await res.json();
      if (data.success) setAuditLogs(data.data.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics?days=14');
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
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
        fetchRanking();
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleUpdateSettings = async (updates: Partial<AdminSettings>) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setSettings(prev => prev ? { ...prev, ...updates } : null);
        alert('تم حفظ الإعدادات');
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleApproveSeller = async (sellerId: string, level?: string) => {
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', level: level || 'BASIC' }),
      });
      const data = await res.json();
      if (data.success) {
        setModeration(prev => prev ? {
          ...prev,
          pendingSellers: prev.pendingSellers.filter(s => s.id !== sellerId),
          counts: { ...prev.counts, pendingSellers: prev.counts.pendingSellers - 1 },
        } : null);
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleRejectSeller = async (sellerId: string) => {
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED' }),
      });
      const data = await res.json();
      if (data.success) {
        setModeration(prev => prev ? {
          ...prev,
          pendingSellers: prev.pendingSellers.filter(s => s.id !== sellerId),
          counts: { ...prev.counts, pendingSellers: prev.counts.pendingSellers - 1 },
        } : null);
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      const data = await res.json();
      if (data.success) {
        setModeration(prev => prev ? {
          ...prev,
          pendingReviews: prev.pendingReviews.filter(r => r.id !== reviewId),
          counts: { ...prev.counts, pendingReviews: prev.counts.pendingReviews - 1 },
        } : null);
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleApproveProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/admin/products/${productId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      const data = await res.json();
      if (data.success) {
        setModeration(prev => prev ? {
          ...prev,
          pendingProducts: prev.pendingProducts.filter(p => p.id !== productId),
          counts: { ...prev.counts, pendingProducts: prev.counts.pendingProducts - 1 },
        } : null);
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleUpdateProductRanking = async (productId: string, updates: { pinned?: boolean; manualBoost?: number; penaltyScore?: number }) => {
    try {
      const res = await fetch(`/api/admin/ranking/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      if (data.success) {
        setRankingProducts(prev => prev.map(p => p.id === productId ? { ...p, ...data.data } : p));
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
            {['overview', 'analytics', 'users', 'admins', 'categories', 'settings', 'moderation', 'ranking', 'audit'].map((tab) => (
              <Button
                key={tab}
                size="sm"
                bg={activeTab === tab ? 'black' : 'white'}
                color={activeTab === tab ? 'white' : 'black'}
                borderWidth={2}
                borderColor="black"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'overview' ? 'نظرة عامة' : 
                 tab === 'analytics' ? 'التحليلات' :
                 tab === 'users' ? 'المستخدمين' :
                 tab === 'admins' ? 'المشرفين' :
                 tab === 'categories' ? 'الفئات' :
                 tab === 'settings' ? 'الإعدادات' :
                 tab === 'moderation' ? 'المراجعة' :
                 tab === 'ranking' ? 'الترتيب' :
                 'سجل التدقيق'}
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && analytics && (
            <VStack gap={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="black">تحليلات آخر {analytics.rangeDays} يوم</Heading>
                <Button size="sm" variant="outline" borderColor="black" onClick={fetchAnalytics}>
                  تحديث
                </Button>
              </HStack>

              <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.orders}</Text>
                  <Text color="gray.600">طلبات</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.gmv.toLocaleString()}</Text>
                  <Text color="gray.600">GMV (ل.س)</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.newUsers}</Text>
                  <Text color="gray.600">مستخدمين جدد</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.newSellers}</Text>
                  <Text color="gray.600">بائعين جدد</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.newProducts}</Text>
                  <Text color="gray.600">منتجات جديدة</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center">
                  <Text fontSize="2xl" fontWeight="bold" color="black">{analytics.totals.conversionRate}%</Text>
                  <Text color="gray.600">تحويل إضافة للسلة</Text>
                </Box>
              </SimpleGrid>

              <Box className="neon-card" p={6}>
                <Heading size="sm" color="black" mb={4}>الأداء اليومي</Heading>
                <VStack align="stretch" gap={2}>
                  {analytics.daily.map((day) => (
                    <HStack key={day.date} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                      <Text color="gray.600">{day.date}</Text>
                      <HStack gap={6}>
                        <Text color="black">طلبات: {day.orders}</Text>
                        <Text color="black">GMV: {day.gmv.toLocaleString()} ل.س</Text>
                      </HStack>
                    </HStack>
                  ))}
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

          {/* Admins Tab */}
          {activeTab === 'admins' && (
            <VStack gap={6} align="stretch">
              <Heading size="md" color="black">إدارة المشرفين</Heading>

              {/* Toast */}
              {adminsToast && (
                <Box
                  p={4}
                  borderRadius="lg"
                  bg={adminsToast.type === 'success' ? 'green.50' : 'red.50'}
                  borderWidth={1}
                  borderColor={adminsToast.type === 'success' ? 'green.300' : 'red.300'}
                >
                  <HStack justify="space-between">
                    <Text color={adminsToast.type === 'success' ? 'green.700' : 'red.700'}>
                      {adminsToast.message}
                    </Text>
                    <Button size="xs" variant="ghost" onClick={() => setAdminsToast(null)}>✕</Button>
                  </HStack>
                </Box>
              )}

              {/* Add admin form */}
              <Box
                p={4}
                borderWidth={2}
                borderColor="black"
                borderRadius="xl"
                boxShadow="4px 4px 0 0 black"
              >
                <Box as="form" onSubmit={handleAddAdmin}>
                  <Stack gap={4}>
                    <Text fontWeight="bold" color="black">إضافة مشرف جديد</Text>
                    <Text fontSize="sm" color="gray.600">
                      أدخل البريد الإلكتروني لترقية مستخدم حالي أو إرسال دعوة لمستخدم جديد
                    </Text>
                    <HStack gap={2}>
                      <Input
                        type="email"
                        placeholder="example@email.com"
                        value={addAdminEmail}
                        onChange={(e) => setAddAdminEmail(e.target.value)}
                        borderWidth={2}
                        borderColor="black"
                        required
                        dir="ltr"
                      />
                      <Button
                        type="submit"
                        bg="black"
                        color="white"
                        _hover={{ bg: 'gray.800' }}
                        disabled={addAdminLoading}
                        minW="120px"
                      >
                        {addAdminLoading ? 'جاري...' : 'إضافة مشرف'}
                      </Button>
                    </HStack>
                  </Stack>
                </Box>
              </Box>

              {/* Admins list */}
              <VStack gap={3} align="stretch">
                <Text fontWeight="bold" color="black">المشرفون الحاليون ({adminUsers.length})</Text>
                {adminUsers.length === 0 ? (
                  <Text color="gray.500" textAlign="center" p={8}>لا يوجد مشرفون</Text>
                ) : (
                  adminUsers.map((admin) => (
                    <Box key={admin.id} className="neon-card" p={4}>
                      <HStack justify="space-between" flexWrap="wrap" gap={2}>
                        <VStack align="start" gap={1}>
                          <HStack>
                            <Text fontWeight="bold" color="black">{admin.name || 'بدون اسم'}</Text>
                            <Badge colorPalette="purple">مشرف</Badge>
                            <Badge colorPalette={admin.status === 'ACTIVE' ? 'green' : 'red'}>
                              {admin.status === 'ACTIVE' ? 'نشط' : admin.status}
                            </Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600" dir="ltr">{admin.email}</Text>
                          <Text fontSize="xs" color="gray.500">
                            انضم: {new Date(admin.createdAt).toLocaleDateString('ar-SY')}
                          </Text>
                        </VStack>
                        <HStack gap={2}>
                          {removeConfirmId === admin.id ? (
                            <>
                              <Text fontSize="sm" color="red.600">تأكيد الإزالة؟</Text>
                              <Button
                                size="sm"
                                colorPalette="red"
                                onClick={() => handleRemoveAdmin(admin.id)}
                              >
                                نعم
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRemoveConfirmId(null)}
                              >
                                لا
                              </Button>
                            </>
                          ) : (
                            session?.user?.id !== admin.id && (
                              <Button
                                size="sm"
                                colorPalette="red"
                                variant="outline"
                                onClick={() => setRemoveConfirmId(admin.id)}
                              >
                                إزالة
                              </Button>
                            )
                          )}
                        </HStack>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
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

          {/* Settings Tab */}
          {activeTab === 'settings' && settings && (
            <VStack gap={6} align="stretch">
              <Heading size="md" color="black">إعدادات النظام</Heading>
              
              {/* Commission Settings */}
              <Box className="neon-card" p={6}>
                <VStack align="stretch" gap={4}>
                  <Heading size="sm" color="black">إعدادات العمولة</Heading>
                  
                  <HStack justify="space-between" p={4} bg={settings.freeMode ? 'green.50' : 'gray.50'} borderRadius="lg">
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold">الوضع المجاني</Text>
                      <Text fontSize="sm" color="gray.600">
                        {settings.freeMode ? 'مفعل - لا توجد عمولات' : 'معطل - يتم احتساب العمولات'}
                      </Text>
                    </VStack>
                    <Button
                      size="sm"
                      colorPalette={settings.freeMode ? 'red' : 'green'}
                      onClick={() => handleUpdateSettings({ freeMode: !settings.freeMode })}
                    >
                      {settings.freeMode ? 'تعطيل' : 'تفعيل'}
                    </Button>
                  </HStack>
                  
                  <HStack justify="space-between" p={4} bg="gray.50" borderRadius="lg">
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold">العمولة الافتراضية</Text>
                      <Text fontSize="sm" color="gray.600">
                        نسبة العمولة العامة لجميع المنتجات
                      </Text>
                    </VStack>
                    <HStack>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        value={settings.globalCommissionRate}
                        onChange={(e) => setSettings({ ...settings, globalCommissionRate: parseFloat(e.target.value) })}
                        w="100px"
                        borderWidth={2}
                        borderColor="black"
                      />
                      <Button
                        size="sm"
                        bg="black"
                        color="white"
                        onClick={() => handleUpdateSettings({ globalCommissionRate: settings.globalCommissionRate })}
                      >
                        حفظ
                      </Button>
                    </HStack>
                  </HStack>
                </VStack>
              </Box>
              
              {/* Ranking Weights */}
              <Box className="neon-card" p={6}>
                <VStack align="stretch" gap={4}>
                  <Heading size="sm" color="black">أوزان الترتيب</Heading>
                  <Text fontSize="sm" color="gray.600">حدد أهمية كل عامل في حساب ترتيب المنتجات (المجموع = 1)</Text>
                  
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    {[
                      { key: 'w_recency', label: 'الحداثة', desc: 'المنتجات الجديدة' },
                      { key: 'w_rating', label: 'التقييم', desc: 'تقييمات العملاء' },
                      { key: 'w_orders', label: 'الطلبات', desc: 'عدد المبيعات' },
                      { key: 'w_stock', label: 'المخزون', desc: 'توفر المنتج' },
                      { key: 'w_sellerRep', label: 'سمعة البائع', desc: 'تقييم البائع' },
                    ].map(({ key, label, desc }) => (
                      <HStack key={key} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold" fontSize="sm">{label}</Text>
                          <Text fontSize="xs" color="gray.500">{desc}</Text>
                        </VStack>
                        <Input
                          type="number"
                          step="0.05"
                          min="0"
                          max="1"
                          value={settings.rankingWeights[key as keyof typeof settings.rankingWeights]}
                          onChange={(e) => setSettings({
                            ...settings,
                            rankingWeights: { ...settings.rankingWeights, [key]: parseFloat(e.target.value) }
                          })}
                          w="80px"
                          borderWidth={2}
                          borderColor="black"
                        />
                      </HStack>
                    ))}
                  </SimpleGrid>
                  
                  <Button
                    bg="black"
                    color="white"
                    onClick={() => handleUpdateSettings({ rankingWeights: settings.rankingWeights })}
                  >
                    حفظ الأوزان
                  </Button>
                </VStack>
              </Box>
              
              {/* Category Commissions */}
              <Box className="neon-card" p={6}>
                <VStack align="stretch" gap={4}>
                  <HStack justify="space-between">
                    <Heading size="sm" color="black">تجاوزات عمولة الفئات</Heading>
                  </HStack>
                  
                  {categoryCommissions.length === 0 ? (
                    <Text color="gray.500" fontSize="sm">لا توجد تجاوزات للفئات</Text>
                  ) : (
                    categoryCommissions.map((cc) => (
                      <HStack key={cc.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <Text fontWeight="bold">{cc.category.name}</Text>
                        <HStack>
                          <Badge colorPalette="blue">{(cc.commissionRate * 100).toFixed(1)}%</Badge>
                        </HStack>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>
              
              {/* Seller Commissions */}
              <Box className="neon-card" p={6}>
                <VStack align="stretch" gap={4}>
                  <Heading size="sm" color="black">تجاوزات عمولة البائعين</Heading>
                  
                  {sellerCommissions.length === 0 ? (
                    <Text color="gray.500" fontSize="sm">لا توجد تجاوزات للبائعين</Text>
                  ) : (
                    sellerCommissions.map((sc) => (
                      <HStack key={sc.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold">{sc.seller.storeName}</Text>
                          <Text fontSize="xs" color="gray.500">{sc.seller.user.email}</Text>
                        </VStack>
                        <HStack>
                          <Badge colorPalette="purple">{sc.tier}</Badge>
                          <Badge colorPalette="blue">{(sc.commissionRate * 100).toFixed(1)}%</Badge>
                        </HStack>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>
            </VStack>
          )}

          {/* Moderation Tab */}
          {activeTab === 'moderation' && moderation && (
            <VStack gap={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="black">صندوق المراجعة</Heading>
                <Badge colorPalette="orange" fontSize="lg" p={2}>
                  {moderation.counts.total} عنصر معلق
                </Badge>
              </HStack>
              
              {/* Summary Cards */}
              <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
                <Box className="neon-card" p={4} textAlign="center" bg="yellow.50">
                  <Text fontSize="2xl" fontWeight="bold" color="yellow.700">{moderation.counts.pendingSellers}</Text>
                  <Text color="yellow.600">بائعين جدد</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center" bg="blue.50">
                  <Text fontSize="2xl" fontWeight="bold" color="blue.700">{moderation.counts.pendingReviews}</Text>
                  <Text color="blue.600">تقييمات</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center" bg="purple.50">
                  <Text fontSize="2xl" fontWeight="bold" color="purple.700">{moderation.counts.pendingProducts}</Text>
                  <Text color="purple.600">منتجات</Text>
                </Box>
                <Box className="neon-card" p={4} textAlign="center" bg="red.50">
                  <Text fontSize="2xl" fontWeight="bold" color="red.700">{moderation.counts.blockedProducts}</Text>
                  <Text color="red.600">محظورة</Text>
                </Box>
              </SimpleGrid>
              
              {/* Pending Sellers */}
              {moderation.pendingSellers.length > 0 && (
                <Box className="neon-card" p={6}>
                  <Heading size="sm" color="black" mb={4}>بائعين بانتظار الموافقة</Heading>
                  <VStack align="stretch" gap={3}>
                    {moderation.pendingSellers.map((seller) => (
                      <HStack key={seller.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold">{seller.storeName}</Text>
                          <Text fontSize="sm" color="gray.600">{seller.user.name} - {seller.user.email}</Text>
                          <Text fontSize="xs" color="gray.500">
                            {new Date(seller.createdAt).toLocaleDateString('ar-SY')}
                          </Text>
                        </VStack>
                        <HStack>
                          <Button size="sm" colorPalette="green" onClick={() => handleApproveSeller(seller.id)}>
                            قبول
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              
              {/* Pending Reviews */}
              {moderation.pendingReviews.length > 0 && (
                <Box className="neon-card" p={6}>
                  <Heading size="sm" color="black" mb={4}>تقييمات بانتظار المراجعة</Heading>
                  <VStack align="stretch" gap={3}>
                    {moderation.pendingReviews.map((review) => (
                      <HStack key={review.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" gap={1}>
                          <HStack>
                            <Text fontWeight="bold">{review.customer.name}</Text>
                            <Badge colorPalette="yellow">{'★'.repeat(review.rating)}</Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">{review.comment || 'بدون تعليق'}</Text>
                          <Text fontSize="xs" color="gray.500">على: {review.product.title}</Text>
                        </VStack>
                        <HStack>
                          <Button size="sm" colorPalette="green" onClick={() => handleApproveReview(review.id)}>
                            قبول
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
              
              {/* Pending Products */}
              {moderation.pendingProducts.length > 0 && (
                <Box className="neon-card" p={6}>
                  <Heading size="sm" color="black" mb={4}>منتجات بانتظار المراجعة</Heading>
                  <VStack align="stretch" gap={3}>
                    {moderation.pendingProducts.map((product) => (
                      <HStack key={product.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg">
                        <VStack align="start" gap={0}>
                          <Text fontWeight="bold">{product.title}</Text>
                          <Text fontSize="sm" color="gray.600">{Number(product.price).toLocaleString()} ل.س</Text>
                          <Text fontSize="xs" color="gray.500">من: {product.seller.storeName}</Text>
                        </VStack>
                        <HStack>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Button size="sm" variant="outline">معاينة</Button>
                          </Link>
                          <Button size="sm" colorPalette="green" onClick={() => handleApproveProduct(product.id)}>
                            نشر
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          )}

          {/* Ranking Tab */}
          {activeTab === 'ranking' && (
            <VStack gap={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md" color="black">وحدة تحكم الترتيب</Heading>
                <Button bg="black" color="white" onClick={handleRecomputeRanking}>
                  إعادة حساب الترتيب
                </Button>
              </HStack>
              
              {/* Ranking Stats */}
              {rankingStats && (
                <SimpleGrid columns={{ base: 3 }} gap={4}>
                  <Box className="neon-card" p={4} textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="purple.600">{rankingStats.pinnedCount}</Text>
                    <Text color="gray.600">مثبت</Text>
                  </Box>
                  <Box className="neon-card" p={4} textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">{rankingStats.boostedCount}</Text>
                    <Text color="gray.600">معزز</Text>
                  </Box>
                  <Box className="neon-card" p={4} textAlign="center">
                    <Text fontSize="2xl" fontWeight="bold" color="red.600">{rankingStats.penalizedCount}</Text>
                    <Text color="gray.600">مُعاقب</Text>
                  </Box>
                </SimpleGrid>
              )}
              
              {/* Products List */}
              <Box className="neon-card" p={4} overflowX="auto">
                <Table.Root size="sm">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>المنتج</Table.ColumnHeader>
                      <Table.ColumnHeader>النتيجة</Table.ColumnHeader>
                      <Table.ColumnHeader>مثبت</Table.ColumnHeader>
                      <Table.ColumnHeader>تعزيز</Table.ColumnHeader>
                      <Table.ColumnHeader>عقوبة</Table.ColumnHeader>
                      <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {rankingProducts.map((product) => (
                      <Table.Row key={product.id}>
                        <Table.Cell>
                          <VStack align="start" gap={0}>
                            <Text fontWeight="bold" fontSize="sm">{product.title}</Text>
                            <Text fontSize="xs" color="gray.500">{product.seller.storeName}</Text>
                          </VStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge colorPalette={product.score > 0.7 ? 'green' : product.score > 0.4 ? 'yellow' : 'red'}>
                            {product.score.toFixed(2)}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            colorPalette={product.pinned ? 'purple' : 'gray'}
                            variant={product.pinned ? 'solid' : 'outline'}
                            onClick={() => handleUpdateProductRanking(product.id, { pinned: !product.pinned })}
                          >
                            {product.pinned ? '📌' : '○'}
                          </Button>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack>
                            <Button
                              size="xs"
                              colorPalette="green"
                              variant="outline"
                              onClick={() => handleUpdateProductRanking(product.id, { manualBoost: Math.min(10, product.manualBoost + 0.5) })}
                            >
                              +
                            </Button>
                            <Text fontSize="sm" fontWeight="bold">{product.manualBoost.toFixed(1)}</Text>
                            <Button
                              size="xs"
                              colorPalette="orange"
                              variant="outline"
                              onClick={() => handleUpdateProductRanking(product.id, { manualBoost: Math.max(0, product.manualBoost - 0.5) })}
                            >
                              -
                            </Button>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <HStack>
                            <Button
                              size="xs"
                              colorPalette="red"
                              variant="outline"
                              onClick={() => handleUpdateProductRanking(product.id, { penaltyScore: Math.min(10, product.penaltyScore + 0.5) })}
                            >
                              +
                            </Button>
                            <Text fontSize="sm" fontWeight="bold">{product.penaltyScore.toFixed(1)}</Text>
                            <Button
                              size="xs"
                              colorPalette="green"
                              variant="outline"
                              onClick={() => handleUpdateProductRanking(product.id, { penaltyScore: Math.max(0, product.penaltyScore - 0.5) })}
                            >
                              -
                            </Button>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Button size="xs" variant="ghost">👁</Button>
                          </Link>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </VStack>
          )}

          {/* Audit Log Tab */}
          {activeTab === 'audit' && (
            <VStack gap={6} align="stretch">
              <Heading size="md" color="black">سجل التدقيق</Heading>
              
              <Box className="neon-card" p={4}>
                <VStack align="stretch" gap={3}>
                  {auditLogs.length === 0 ? (
                    <Text color="gray.500" textAlign="center">لا توجد سجلات</Text>
                  ) : (
                    auditLogs.map((log) => (
                      <HStack key={log.id} justify="space-between" p={3} bg="gray.50" borderRadius="lg" flexWrap="wrap">
                        <VStack align="start" gap={0}>
                          <HStack>
                            <Badge colorPalette="blue">{log.action}</Badge>
                            <Badge colorPalette="gray">{log.entityType}</Badge>
                          </HStack>
                          <Text fontSize="sm" color="gray.600">
                            بواسطة: {log.admin.name}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color="gray.500">
                          {new Date(log.createdAt).toLocaleString('ar-SY')}
                        </Text>
                      </HStack>
                    ))
                  )}
                </VStack>
              </Box>
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
