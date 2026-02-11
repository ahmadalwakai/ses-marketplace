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

interface SellerData {
  id: string;
  storeName: string;
  slug: string;
  bio: string | null;
  verificationStatus: string;
  verificationLevel: string;
  isSmallBusiness: boolean;
  ratingAvg: number;
  ratingCount: number;
  totalSales: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string; status: string };
  _count: { products: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
};

const statusLabels: Record<string, string> = {
  PENDING: 'بانتظار التحقق',
  APPROVED: 'موثق',
  REJECTED: 'مرفوض',
};

const levelLabels: Record<string, string> = {
  BASIC: 'أساسي',
  VERIFIED: 'موثق',
  PREMIUM: 'مميز',
  TOP_RATED: 'الأعلى تقييماً',
};

export default function AdminSellersPage() {
  const toast = useAppToast();
  const [sellers, setSellers] = useState<SellerData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchSellers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/sellers?${params}`);
      const json = await res.json();
      if (json.ok) {
        setSellers(json.data.items);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error('خطأ في تحميل البائعين');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, toast]);

  useEffect(() => { fetchSellers(); }, [fetchSellers]);

  const verifySeller = async (sellerId: string, status: 'APPROVED' | 'REJECTED', level?: string) => {
    const label = status === 'APPROVED' ? 'توثيق' : 'رفض';
    if (!confirm(`هل أنت متأكد من ${label} هذا البائع؟`)) return;

    setActionLoading(sellerId);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verificationStatus: status,
          ...(level && { verificationLevel: level }),
        }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success(`تم ${label} البائع`);
        fetchSellers();
      } else {
        toast.error(json.error?.message || 'فشل التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleSmallBusiness = async (sellerId: string, current: boolean) => {
    setActionLoading(sellerId);
    try {
      const res = await fetch(`/api/admin/sellers/${sellerId}/small-business`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSmallBusiness: !current }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم التحديث');
        fetchSellers();
      } else {
        toast.error(json.error?.message || 'فشل');
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
        <Heading size="lg">إدارة البائعين</Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.500">إجمالي: {pagination.total} بائع</Text>
        )}
      </HStack>

      {/* Filters */}
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="بحث بالاسم أو البريد..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW="300px"
          bg="white"
        />
        <select style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحالات</option>
          <option value="PENDING">بانتظار التحقق</option>
          <option value="APPROVED">موثق</option>
          <option value="REJECTED">مرفوض</option>
        </select>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : sellers.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>🏪</Text>
            <Text color="gray.500">لا يوجد بائعون</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>المتجر</Table.ColumnHeader>
                <Table.ColumnHeader>المالك</Table.ColumnHeader>
                <Table.ColumnHeader>التحقق</Table.ColumnHeader>
                <Table.ColumnHeader>المستوى</Table.ColumnHeader>
                <Table.ColumnHeader>المنتجات</Table.ColumnHeader>
                <Table.ColumnHeader>التقييم</Table.ColumnHeader>
                <Table.ColumnHeader>المبيعات</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sellers.map((seller) => (
                <Table.Row key={seller.id}>
                  <Table.Cell>
                    <VStack gap={0} align="start">
                      <Text fontWeight="medium" fontSize="sm">{seller.storeName}</Text>
                      <Text fontSize="xs" color="gray.500">/{seller.slug}</Text>
                      {seller.isSmallBusiness && <Badge colorScheme="teal" fontSize="2xs">مشروع صغير</Badge>}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <VStack gap={0} align="start">
                      <Text fontSize="sm">{seller.user.name || '—'}</Text>
                      <Text fontSize="xs" color="gray.500">{seller.user.email}</Text>
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={statusColors[seller.verificationStatus] || 'gray'}>
                      {statusLabels[seller.verificationStatus] || seller.verificationStatus}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs">{levelLabels[seller.verificationLevel] || seller.verificationLevel}</Text>
                  </Table.Cell>
                  <Table.Cell>{seller._count.products}</Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm">{seller.ratingAvg ? `${seller.ratingAvg.toFixed(1)} ⭐ (${seller.ratingCount})` : '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>{seller.totalSales}</Table.Cell>
                  <Table.Cell>
                    <VStack gap={1} align="start">
                      <HStack gap={1}>
                        {seller.verificationStatus === 'PENDING' && (
                          <>
                            <Button size="xs" colorScheme="green"
                              disabled={actionLoading === seller.id}
                              onClick={() => verifySeller(seller.id, 'APPROVED', 'VERIFIED')}>
                              توثيق
                            </Button>
                            <Button size="xs" colorScheme="red" variant="outline"
                              disabled={actionLoading === seller.id}
                              onClick={() => verifySeller(seller.id, 'REJECTED')}>
                              رفض
                            </Button>
                          </>
                        )}
                        {seller.verificationStatus === 'APPROVED' && (
                          <Button size="xs" colorScheme="red" variant="outline"
                            disabled={actionLoading === seller.id}
                            onClick={() => verifySeller(seller.id, 'REJECTED')}>
                            إلغاء التوثيق
                          </Button>
                        )}
                        {seller.verificationStatus === 'REJECTED' && (
                          <Button size="xs" colorScheme="green"
                            disabled={actionLoading === seller.id}
                            onClick={() => verifySeller(seller.id, 'APPROVED', 'BASIC')}>
                            إعادة التوثيق
                          </Button>
                        )}
                      </HStack>
                      <Button size="xs" variant="outline"
                        colorScheme={seller.isSmallBusiness ? 'teal' : 'gray'}
                        disabled={actionLoading === seller.id}
                        onClick={() => toggleSmallBusiness(seller.id, seller.isSmallBusiness)}>
                        {seller.isSmallBusiness ? 'إلغاء مشروع صغير' : 'تعيين مشروع صغير'}
                      </Button>
                    </VStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

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
