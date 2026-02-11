'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
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
  Table,
  Input,
} from '@chakra-ui/react';
import { useAppToast } from '@/components/Toast';

interface UserData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  sellerProfile?: { storeName: string; verificationStatus: string } | null;
  _count: { orders: number; reviews: number };
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
  SUSPENDED: 'orange',
  BANNED: 'red',
};

const roleLabels: Record<string, string> = {
  ADMIN: 'مشرف',
  SELLER: 'بائع',
  CUSTOMER: 'عميل',
  VISITOR: 'زائر',
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const toast = useAppToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('q', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      if (json.ok) {
        setUsers(json.data.items);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error('خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, toast]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const updateStatus = async (userId: string, newStatus: string) => {
    if (!confirm(`هل أنت متأكد من تغيير حالة المستخدم إلى ${newStatus}؟`)) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم تحديث حالة المستخدم');
        fetchUsers();
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
        <Heading size="lg">إدارة المستخدمين</Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.500">
            إجمالي: {pagination.total} مستخدم
          </Text>
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
          value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">كل الأدوار</option>
          <option value="ADMIN">مشرف</option>
          <option value="SELLER">بائع</option>
          <option value="CUSTOMER">عميل</option>
          <option value="VISITOR">زائر</option>
        </select>
        <select style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="PENDING">معلق</option>
          <option value="SUSPENDED">موقوف</option>
          <option value="BANNED">محظور</option>
        </select>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : users.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>👥</Text>
            <Text color="gray.500">لا يوجد مستخدمون مطابقون</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>المستخدم</Table.ColumnHeader>
                <Table.ColumnHeader>الدور</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>الطلبات</Table.ColumnHeader>
                <Table.ColumnHeader>التقييمات</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ التسجيل</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map((user) => (
                <Table.Row key={user.id}>
                  <Table.Cell>
                    <VStack gap={0} align="start">
                      <Text fontWeight="medium" fontSize="sm">{user.name || '—'}</Text>
                      <Text fontSize="xs" color="gray.500">{user.email}</Text>
                      {user.sellerProfile && (
                        <Text fontSize="xs" color="blue.500">🏪 {user.sellerProfile.storeName}</Text>
                      )}
                    </VStack>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={user.role === 'ADMIN' ? 'purple' : user.role === 'SELLER' ? 'blue' : 'gray'}>
                      {roleLabels[user.role] || user.role}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={statusColors[user.status] || 'gray'}>
                      {user.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>{user._count.orders}</Table.Cell>
                  <Table.Cell>{user._count.reviews}</Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs">{new Date(user.createdAt).toLocaleDateString('ar-SY')}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={1}>
                      {user.status !== 'ACTIVE' && (
                        <Button size="xs" colorScheme="green"
                          disabled={actionLoading === user.id}
                          onClick={() => updateStatus(user.id, 'ACTIVE')}>
                          تفعيل
                        </Button>
                      )}
                      {user.status !== 'SUSPENDED' && user.role !== 'ADMIN' && (
                        <Button size="xs" colorScheme="orange"
                          disabled={actionLoading === user.id}
                          onClick={() => updateStatus(user.id, 'SUSPENDED')}>
                          إيقاف
                        </Button>
                      )}
                      {user.status !== 'BANNED' && user.role !== 'ADMIN' && (
                        <Button size="xs" colorScheme="red"
                          disabled={actionLoading === user.id}
                          onClick={() => updateStatus(user.id, 'BANNED')}>
                          حظر
                        </Button>
                      )}
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
