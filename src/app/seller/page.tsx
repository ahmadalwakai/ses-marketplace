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
} from '@chakra-ui/react';

interface SellerProfile {
  id: string;
  storeName: string;
  bio: string | null;
  rating: number;
  totalSales: number;
  verified: boolean;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  images: { url: string }[];
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { quantity: number; price: number; product: { title: string } }[];
  customer: { name: string };
}

interface Earnings {
  totalEarnings: number;
  pendingEarnings: number;
  totalOrders: number;
  completedOrders: number;
}

export default function SellerDashboardPage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    price: '',
    stock: '',
    categoryId: '',
    condition: 'NEW',
  });

  // Profile form
  const [profileForm, setProfileForm] = useState({
    storeName: '',
    bio: '',
  });

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [profileRes, productsRes, ordersRes, earningsRes] = await Promise.all([
        fetch('/api/seller/me'),
        fetch('/api/seller/products'),
        fetch('/api/seller/orders'),
        fetch('/api/seller/earnings'),
      ]);

      const profileData = await profileRes.json();
      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const earningsData = await earningsRes.json();

      if (profileData.success) {
        setProfile(profileData.data);
        setProfileForm({
          storeName: profileData.data.storeName,
          bio: profileData.data.bio || '',
        });
      }
      if (productsData.success) setProducts(productsData.data);
      if (ordersData.success) setOrders(ordersData.data);
      if (earningsData.success) setEarnings(earningsData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/seller/products/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price),
          stock: parseInt(newProduct.stock),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts([data.data, ...products]);
        setShowCreateForm(false);
        setNewProduct({ title: '', description: '', price: '', stock: '', categoryId: '', condition: 'NEW' });
      } else {
        alert(data.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ غير متوقع');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/seller/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (data.success) {
        setProfile(data.data);
        setShowProfileForm(false);
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

  // Show profile creation form if no seller profile
  if (!profile) {
    return (
      <Box minH="100vh" bg="white" py={20}>
        <Container maxW="md">
          <VStack gap={6}>
            <Heading color="black">إنشاء متجرك</Heading>
            <Text color="gray.600">أنشئ ملف البائع الخاص بك للبدء بالبيع</Text>
            
            <Box
              as="form"
              onSubmit={handleUpdateProfile}
              w="full"
              p={6}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <Stack gap={4}>
                <Stack gap={2}>
                  <Text fontWeight="bold">اسم المتجر</Text>
                  <Input
                    value={profileForm.storeName}
                    onChange={(e) => setProfileForm({ ...profileForm, storeName: e.target.value })}
                    placeholder="متجر أحمد للإلكترونيات"
                    borderWidth={2}
                    borderColor="black"
                    required
                  />
                </Stack>
                <Stack gap={2}>
                  <Text fontWeight="bold">وصف المتجر (اختياري)</Text>
                  <Textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="نبذة عن متجرك..."
                    borderWidth={2}
                    borderColor="black"
                  />
                </Stack>
                <Button type="submit" bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                  إنشاء المتجر
                </Button>
              </Stack>
            </Box>
          </VStack>
        </Container>
      </Box>
    );
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'قيد المراجعة',
    APPROVED: 'معتمد',
    REJECTED: 'مرفوض',
  };

  const orderStatusLabels: Record<string, string> = {
    PENDING: 'قيد الانتظار',
    CONFIRMED: 'مؤكد',
    SHIPPED: 'تم الشحن',
    DELIVERED: 'تم التوصيل',
    CANCELLED: 'ملغي',
  };

  return (
    <Box minH="100vh" bg="white" py={10}>
      <Container maxW="7xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <HStack justify="space-between" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={1}>
              <HStack>
                <Heading size="xl" color="black">
                  {profile.storeName}
                </Heading>
                {profile.verified && (
                  <Badge colorPalette="green">موثق ✓</Badge>
                )}
              </HStack>
              <Text color="gray.600">لوحة تحكم البائع</Text>
            </VStack>
            <HStack gap={2}>
              <Button
                variant="outline"
                borderColor="black"
                color="black"
                onClick={() => setShowProfileForm(true)}
              >
                تعديل الملف
              </Button>
              <Button
                bg="black"
                color="white"
                _hover={{ bg: 'gray.800' }}
                onClick={() => setShowCreateForm(true)}
              >
                + منتج جديد
              </Button>
            </HStack>
          </HStack>

          {/* Stats */}
          <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {earnings?.totalEarnings?.toLocaleString() || 0}
              </Text>
              <Text color="gray.600">إجمالي الأرباح (ل.س)</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {earnings?.pendingEarnings?.toLocaleString() || 0}
              </Text>
              <Text color="gray.600">أرباح معلقة (ل.س)</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {products.length}
              </Text>
              <Text color="gray.600">المنتجات</Text>
            </Box>
            <Box className="neon-card" p={6} textAlign="center">
              <Text fontSize="3xl" fontWeight="bold" color="black">
                {profile.rating.toFixed(1)}
              </Text>
              <Text color="gray.600">التقييم</Text>
            </Box>
          </SimpleGrid>

          {/* Create Product Form */}
          {showCreateForm && (
            <Box
              p={6}
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <HStack justify="space-between" mb={4}>
                <Heading size="md" color="black">منتج جديد</Heading>
                <Button size="sm" variant="ghost" onClick={() => setShowCreateForm(false)}>
                  ✕
                </Button>
              </HStack>
              <Box as="form" onSubmit={handleCreateProduct}>
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  <Stack gap={2}>
                    <Text fontWeight="bold">عنوان المنتج</Text>
                    <Input
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({ ...newProduct, title: e.target.value })}
                      borderWidth={2}
                      borderColor="black"
                      required
                    />
                  </Stack>
                  <Stack gap={2}>
                    <Text fontWeight="bold">السعر (ل.س)</Text>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      borderWidth={2}
                      borderColor="black"
                      required
                    />
                  </Stack>
                  <Stack gap={2}>
                    <Text fontWeight="bold">الكمية</Text>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                      borderWidth={2}
                      borderColor="black"
                      required
                    />
                  </Stack>
                  <Stack gap={2}>
                    <Text fontWeight="bold">معرف الفئة</Text>
                    <Input
                      value={newProduct.categoryId}
                      onChange={(e) => setNewProduct({ ...newProduct, categoryId: e.target.value })}
                      borderWidth={2}
                      borderColor="black"
                      required
                    />
                  </Stack>
                  <Stack gap={2} gridColumn={{ md: 'span 2' }}>
                    <Text fontWeight="bold">الوصف</Text>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      borderWidth={2}
                      borderColor="black"
                      required
                    />
                  </Stack>
                </SimpleGrid>
                <Button type="submit" mt={4} bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                  إنشاء المنتج
                </Button>
              </Box>
            </Box>
          )}

          {/* Products */}
          <Box>
            <Heading size="lg" color="black" mb={4}>منتجاتي</Heading>
            {products.length === 0 ? (
              <Box className="neon-card" p={8} textAlign="center">
                <Text color="gray.600">لا توجد منتجات بعد</Text>
              </Box>
            ) : (
              <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={4}>
                {products.map((product) => (
                  <Box key={product.id} className="neon-card" p={4}>
                    <VStack align="stretch" gap={2}>
                      <Box h="120px" bg="gray.100" borderRadius="lg" overflow="hidden">
                        {product.images[0] ? (
                          <img src={product.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        ) : (
                          <VStack h="full" justify="center">
                            <Text color="gray.400" fontSize="sm">لا توجد صورة</Text>
                          </VStack>
                        )}
                      </Box>
                      <Text fontWeight="bold" color="black" lineClamp={1}>
                        {product.title}
                      </Text>
                      <HStack justify="space-between">
                        <Text color="black">{product.price.toLocaleString()} ل.س</Text>
                        <Badge
                          colorPalette={product.status === 'APPROVED' ? 'green' : product.status === 'REJECTED' ? 'red' : 'yellow'}
                        >
                          {statusLabels[product.status] || product.status}
                        </Badge>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">
                        المخزون: {product.stock}
                      </Text>
                    </VStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>

          {/* Orders */}
          <Box>
            <Heading size="lg" color="black" mb={4}>الطلبات الواردة</Heading>
            {orders.length === 0 ? (
              <Box className="neon-card" p={8} textAlign="center">
                <Text color="gray.600">لا توجد طلبات بعد</Text>
              </Box>
            ) : (
              <VStack gap={4} align="stretch">
                {orders.slice(0, 5).map((order) => (
                  <Box key={order.id} className="neon-card" p={4}>
                    <HStack justify="space-between" mb={2}>
                      <Text fontWeight="bold" color="black">
                        طلب #{order.id.slice(-8)}
                      </Text>
                      <Badge colorPalette={order.status === 'DELIVERED' ? 'green' : 'blue'}>
                        {orderStatusLabels[order.status] || order.status}
                      </Badge>
                    </HStack>
                    <Text fontSize="sm" color="gray.600" mb={2}>
                      العميل: {order.customer.name}
                    </Text>
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.500">
                        {new Date(order.createdAt).toLocaleDateString('ar-SY')}
                      </Text>
                      <Text fontWeight="bold" color="black">
                        {order.total.toLocaleString()} ل.س
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
