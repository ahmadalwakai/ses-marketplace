'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Button,
  Table,
  Input,
} from '@chakra-ui/react';
import { useAppToast } from '@/components/Toast';

interface ProductData {
  id: string;
  title: string;
  titleAr?: string;
  price: number;
  status: string;
  pinned: boolean;
  manualBoost: number;
  createdAt: string;
  seller?: { storeName: string; user: { name: string } };
  category?: { name: string } | null;
  _count?: { orderItems: number; reviews: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const statusColors: Record<string, string> = {
  ACTIVE: 'green',
  PENDING: 'yellow',
  DRAFT: 'gray',
  PAUSED: 'orange',
  BLOCKED: 'red',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'نشط',
  PENDING: 'بانتظار المراجعة',
  DRAFT: 'مسودة',
  PAUSED: 'متوقف',
  BLOCKED: 'محظور',
};

export default function AdminProductsPage() {
  const toast = useAppToast();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/products?${params}`);
      const json = await res.json();
      if (json.ok) {
        setProducts(json.data.items);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error('خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const moderateProduct = async (productId: string, action: { status?: string; pinned?: boolean; manualBoost?: number }) => {
    const label = action.status || (action.pinned !== undefined ? (action.pinned ? 'تثبيت' : 'إلغاء تثبيت') : 'تحديث');
    if (action.status === 'BLOCKED' && !confirm('هل أنت متأكد من حظر هذا المنتج؟')) return;

    setActionLoading(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/moderate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`تم ${label} المنتج`);
        fetchProducts();
      } else {
        toast.error(json.error?.message || 'فشل التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap">
        <Heading size="lg">إدارة المنتجات</Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.500">إجمالي: {pagination.total} منتج</Text>
        )}
      </HStack>

      {/* Filters */}
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="بحث بالعنوان..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW="300px"
          bg="white"
        />
        <select style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="PENDING">بانتظار المراجعة</option>
          <option value="DRAFT">مسودة</option>
          <option value="PAUSED">متوقف</option>
          <option value="BLOCKED">محظور</option>
        </select>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : products.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>🛍️</Text>
            <Text color="gray.500">لا يوجد منتجات مطابقة</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>المنتج</Table.ColumnHeader>
                <Table.ColumnHeader>السعر</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>البائع</Table.ColumnHeader>
                <Table.ColumnHeader>التصنيف</Table.ColumnHeader>
                <Table.ColumnHeader>مثبت</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {products.map((product) => (
                <Table.Row key={product.id}>
                  <Table.Cell>
                    <VStack gap={0} align="start">
                      <Text fontWeight="medium" fontSize="sm" maxW="200px" truncate>{product.title}</Text>
                      {product.titleAr && <Text fontSize="xs" color="gray.500" truncate maxW="200px">{product.titleAr}</Text>}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" fontWeight="medium">{product.price.toLocaleString()} ل.س</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={statusColors[product.status] || 'gray'}>
                      {statusLabels[product.status] || product.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs">{product.seller?.storeName || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs">{product.category?.name || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {product.pinned ? <Badge colorScheme="blue">📌</Badge> : '—'}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1} flexWrap="wrap">
                      {product.status === 'PENDING' && (
                        <Button size="xs" colorScheme="green"
                          disabled={actionLoading === product.id}
                          onClick={() => moderateProduct(product.id, { status: 'ACTIVE' })}>
                          قبول
                        </Button>
                      )}
                      {product.status !== 'BLOCKED' && (
                        <Button size="xs" colorScheme="red"
                          disabled={actionLoading === product.id}
                          onClick={() => moderateProduct(product.id, { status: 'BLOCKED' })}>
                          حظر
                        </Button>
                      )}
                      {product.status === 'BLOCKED' && (
                        <Button size="xs" colorScheme="green"
                          disabled={actionLoading === product.id}
                          onClick={() => moderateProduct(product.id, { status: 'ACTIVE' })}>
                          إعادة
                        </Button>
                      )}
                      <Button size="xs" variant={product.pinned ? 'solid' : 'outline'} colorScheme="blue"
                        disabled={actionLoading === product.id}
                        onClick={() => moderateProduct(product.id, { pinned: !product.pinned })}>
                        {product.pinned ? 'إلغاء تثبيت' : 'تثبيت'}
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <HStack justify="center" gap={2}>
          <Button size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button>
          <Text fontSize="sm">{page} / {pagination.totalPages}</Text>
          <Button size="sm" disabled={!pagination.hasMore} onClick={() => setPage(page + 1)}>التالي</Button>
        </HStack>
      )}
    </VStack>
  );
}
