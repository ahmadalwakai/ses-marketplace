'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
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
  Badge,
  Spinner,
  Button,
  Input,
  Checkbox,
} from '@chakra-ui/react';

interface Product {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string;
  price: number;
  quantity: number;
  status: string;
  viewCount: number;
  addToCartCount: number;
  images: { url: string }[];
}

interface SellerProfile {
  lowStockThreshold: number;
}

interface BulkEditItem {
  productId: string;
  price?: number;
  quantity?: number;
}

const statusLabels: Record<string, string> = {
  DRAFT: 'مسودة',
  PENDING: 'قيد المراجعة',
  ACTIVE: 'نشط',
  PAUSED: 'متوقف',
  BLOCKED: 'محظور',
};

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  PENDING: 'yellow',
  ACTIVE: 'green',
  PAUSED: 'orange',
  BLOCKED: 'red',
};

export default function SellerProductsPage() {
  const { status } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Map<string, BulkEditItem>>(new Map());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData();
    }
  }, [status]);

  const fetchData = async () => {
    try {
      const [productsRes, profileRes] = await Promise.all([
        fetch('/api/seller/products'),
        fetch('/api/seller/me'),
      ]);

      const productsData = await productsRes.json();
      const profileData = await profileRes.json();

      if (productsData.success) {
        setProducts(productsData.data || []);
      }
      if (profileData.success) {
        setProfile({
          lowStockThreshold: profileData.data?.lowStockThreshold || 5,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      const newEdits = new Map(bulkEdits);
      newEdits.delete(id);
      setBulkEdits(newEdits);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
      setBulkEdits(new Map());
    } else {
      setSelectedIds(new Set(products.map((p) => p.id)));
    }
  };

  const updateBulkEdit = (productId: string, field: 'price' | 'quantity', value: number) => {
    const newEdits = new Map(bulkEdits);
    const existing = newEdits.get(productId) || { productId };
    newEdits.set(productId, { ...existing, [field]: value });
    setBulkEdits(newEdits);
  };

  const handleBulkSave = async () => {
    if (bulkEdits.size === 0) {
      setMessage({ type: 'error', text: 'لم يتم إجراء أي تغييرات' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const items = Array.from(bulkEdits.values()).filter(
        (item) => item.price !== undefined || item.quantity !== undefined
      );

      if (items.length === 0) {
        setMessage({ type: 'error', text: 'لم يتم إجراء أي تغييرات' });
        setSaving(false);
        return;
      }

      const res = await fetch('/api/seller/products/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: `تم تحديث ${data.data.updated} منتج بنجاح` });
        setBulkMode(false);
        setSelectedIds(new Set());
        setBulkEdits(new Map());
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ أثناء التحديث' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ في الاتصال' });
    } finally {
      setSaving(false);
    }
  };

  const lowStockThreshold = profile?.lowStockThreshold || 5;
  const lowStockProducts = products.filter(
    (p) => p.quantity <= lowStockThreshold && p.status === 'ACTIVE'
  );

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
                منتجاتي
              </Heading>
              <Text color="gray.600">
                إدارة منتجاتك ومخزونك
              </Text>
            </VStack>
            <HStack gap={2} flexWrap="wrap">
              {!bulkMode ? (
                <>
                  <Button
                    variant="outline"
                    borderColor="black"
                    color="black"
                    onClick={() => setBulkMode(true)}
                    _hover={{ bg: 'gray.100' }}
                  >
                    تعديل جماعي
                  </Button>
                  <Link href="/seller/products/new">
                    <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                      + منتج جديد
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    borderColor="black"
                    onClick={() => {
                      setBulkMode(false);
                      setSelectedIds(new Set());
                      setBulkEdits(new Map());
                    }}
                  >
                    إلغاء
                  </Button>
                  <Button
                    bg="black"
                    color="white"
                    onClick={handleBulkSave}
                    loading={saving}
                    disabled={bulkEdits.size === 0}
                    _hover={{ bg: 'gray.800' }}
                  >
                    حفظ التغييرات ({bulkEdits.size})
                  </Button>
                </>
              )}
            </HStack>
          </HStack>

          {/* Message */}
          {message && (
            <Box
              p={3}
              borderRadius="md"
              bg={message.type === 'success' ? 'green.50' : 'red.50'}
              borderWidth={1}
              borderColor={message.type === 'success' ? 'green.200' : 'red.200'}
            >
              <Text color={message.type === 'success' ? 'green.700' : 'red.700'}>
                {message.text}
              </Text>
            </Box>
          )}

          {/* Low Stock Alert */}
          {lowStockProducts.length > 0 && (
            <Box
              p={4}
              borderWidth={2}
              borderColor="orange.400"
              borderRadius="xl"
              bg="orange.50"
            >
              <HStack gap={2} mb={2}>
                <Text fontSize="xl">⚠️</Text>
                <Text fontWeight="bold" color="orange.700">
                  تنبيه: منتجات منخفضة المخزون ({lowStockProducts.length})
                </Text>
              </HStack>
              <Text color="orange.600" fontSize="sm" mb={2}>
                المنتجات التالية وصلت للحد الأدنى ({lowStockThreshold} أو أقل):
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {lowStockProducts.slice(0, 5).map((p) => (
                  <Badge key={p.id} colorPalette="orange" px={2} py={1}>
                    {p.titleAr || p.title} ({p.quantity})
                  </Badge>
                ))}
                {lowStockProducts.length > 5 && (
                  <Badge colorPalette="orange">+{lowStockProducts.length - 5} آخرين</Badge>
                )}
              </HStack>
            </Box>
          )}

          {/* Bulk Mode Header */}
          {bulkMode && products.length > 0 && (
            <HStack
              p={3}
              bg="gray.50"
              borderRadius="lg"
              justify="space-between"
            >
              <HStack gap={3}>
                <Checkbox.Root
                  checked={selectedIds.size === products.length}
                  onCheckedChange={toggleSelectAll}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control borderColor="black">
                    <Checkbox.Indicator>
                      <Text>✓</Text>
                    </Checkbox.Indicator>
                  </Checkbox.Control>
                </Checkbox.Root>
                <Text fontWeight="medium">
                  تحديد الكل ({selectedIds.size}/{products.length})
                </Text>
              </HStack>
              <Text color="gray.600" fontSize="sm">
                حدد المنتجات وعدّل الأسعار أو الكميات
              </Text>
            </HStack>
          )}

          {/* Products Grid */}
          {products.length === 0 ? (
            <Box
              p={12}
              textAlign="center"
              borderWidth={2}
              borderColor="black"
              borderRadius="xl"
              boxShadow="4px 4px 0 0 black"
            >
              <VStack gap={4}>
                <Text fontSize="4xl">📦</Text>
                <Heading size="lg" color="black">
                  لا توجد منتجات
                </Heading>
                <Text color="gray.600">
                  ابدأ بإضافة منتجك الأول
                </Text>
                <Link href="/seller/products/new">
                  <Button bg="black" color="white" _hover={{ bg: 'gray.800' }}>
                    + إضافة منتج
                  </Button>
                </Link>
              </VStack>
            </Box>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
              {products.map((product) => {
                const isLowStock = product.quantity <= lowStockThreshold && product.status === 'ACTIVE';
                const isSelected = selectedIds.has(product.id);
                const edit = bulkEdits.get(product.id);

                return (
                  <Box
                    key={product.id}
                    borderWidth={2}
                    borderColor={isSelected ? 'blue.500' : isLowStock ? 'orange.400' : 'black'}
                    borderRadius="xl"
                    boxShadow={isSelected ? '4px 4px 0 0 #3182ce' : '4px 4px 0 0 black'}
                    overflow="hidden"
                    transition="all 0.2s"
                    bg={isSelected ? 'blue.50' : 'white'}
                  >
                    {/* Image & Selection */}
                    <Box position="relative">
                      <Box h="150px" bg="gray.100" overflow="hidden" position="relative">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url}
                            alt={product.titleAr || product.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            sizes="(max-width: 768px) 50vw, 33vw"
                          />
                        ) : (
                          <VStack h="full" justify="center">
                            <Text color="gray.400">لا توجد صورة</Text>
                          </VStack>
                        )}
                      </Box>

                      {bulkMode && (
                        <Box position="absolute" top={2} left={2}>
                          <Checkbox.Root
                            checked={isSelected}
                            onCheckedChange={() => toggleSelect(product.id)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control
                              borderColor="black"
                              bg="white"
                              borderWidth={2}
                              w="24px"
                              h="24px"
                            >
                              <Checkbox.Indicator>
                                <Text fontWeight="bold">✓</Text>
                              </Checkbox.Indicator>
                            </Checkbox.Control>
                          </Checkbox.Root>
                        </Box>
                      )}

                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorPalette={statusColors[product.status]}
                      >
                        {statusLabels[product.status]}
                      </Badge>

                      {isLowStock && (
                        <Badge
                          position="absolute"
                          bottom={2}
                          right={2}
                          colorPalette="orange"
                        >
                          ⚠️ مخزون منخفض
                        </Badge>
                      )}
                    </Box>

                    {/* Content */}
                    <VStack align="stretch" p={4} gap={3}>
                      <Text
                        fontWeight="semibold"
                        color="black"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {product.titleAr || product.title}
                      </Text>

                      {/* Stats */}
                      <HStack gap={3} fontSize="sm" color="gray.600">
                        <Text>👁 {product.viewCount}</Text>
                        <Text>🛒 {product.addToCartCount}</Text>
                      </HStack>

                      {/* Price & Quantity - Editable in bulk mode */}
                      {bulkMode && isSelected ? (
                        <VStack gap={2} align="stretch">
                          <HStack gap={2}>
                            <Text fontSize="sm" w="60px">السعر:</Text>
                            <Input
                              size="sm"
                              type="number"
                              placeholder={String(product.price)}
                              defaultValue={product.price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  updateBulkEdit(product.id, 'price', val);
                                }
                              }}
                              borderColor="black"
                            />
                          </HStack>
                          <HStack gap={2}>
                            <Text fontSize="sm" w="60px">الكمية:</Text>
                            <Input
                              size="sm"
                              type="number"
                              placeholder={String(product.quantity)}
                              defaultValue={product.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val >= 0) {
                                  updateBulkEdit(product.id, 'quantity', val);
                                }
                              }}
                              borderColor="black"
                            />
                          </HStack>
                        </VStack>
                      ) : (
                        <HStack justify="space-between">
                          <Text fontWeight="bold" fontSize="lg" color="black">
                            {Number(product.price).toLocaleString()} ل.س
                          </Text>
                          <Text color={isLowStock ? 'orange.600' : 'gray.600'}>
                            الكمية: {product.quantity}
                          </Text>
                        </HStack>
                      )}

                      {/* Actions */}
                      {!bulkMode && (
                        <HStack gap={2}>
                          <Link href={`/products/${product.slug}`} style={{ flex: 1 }}>
                            <Button
                              size="sm"
                              variant="outline"
                              borderColor="black"
                              w="full"
                            >
                              معاينة
                            </Button>
                          </Link>
                          <Link href={`/seller/products/${product.id}/edit`} style={{ flex: 1 }}>
                            <Button
                              size="sm"
                              bg="black"
                              color="white"
                              w="full"
                              _hover={{ bg: 'gray.800' }}
                            >
                              تعديل
                            </Button>
                          </Link>
                        </HStack>
                      )}
                    </VStack>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      </Container>

      {/* Floating Add Product CTA (mobile) */}
      <Box
        display={{ base: 'block', md: 'none' }}
        position="fixed"
        bottom={6}
        left="50%"
        transform="translateX(-50%)"
        zIndex={50}
      >
        <Link href="/seller/products/new">
          <Button
            bg="black"
            color="white"
            size="lg"
            borderRadius="full"
            px={8}
            boxShadow="0 4px 20px rgba(0,0,0,0.3)"
            _hover={{ bg: 'gray.800' }}
          >
            + أضف منتج جديد
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
