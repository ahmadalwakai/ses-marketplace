'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
import {
  Box,
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

interface OrderData {
  id: string;
  total: number;
  commissionTotal: number;
  status: string;
  deliveryMode: string;
  createdAt: string;
  customer: { id: string; name: string | null; email: string };
  seller: { storeName: string };
  items: Array<{ id: string; quantity: number; price: number; product: { title: string } }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface OrderSummary {
  byStatus: Record<string, number>;
  totalRevenue: number;
}

const statusColors: Record<string, string> = {
  PENDING: 'yellow',
  CONFIRMED: 'blue',
  PACKING: 'cyan',
  SHIPPED: 'purple',
  DELIVERED: 'green',
  CANCELLED: 'red',
  DISPUTED: 'orange',
  RESOLVED: 'teal',
};

const statusLabels: Record<string, string> = {
  PENDING: 'معلق',
  CONFIRMED: 'مؤكد',
  PACKING: 'قيد التجهيز',
  SHIPPED: 'تم الشحن',
  DELIVERED: 'تم التسليم',
  CANCELLED: 'ملغي',
  DISPUTED: 'متنازع عليه',
  RESOLVED: 'تم الحل',
};

const statusFlow: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DISPUTED: ['RESOLVED'],
};

export default function AdminOrdersPage() {
  const toast = useAppToast();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('q', search);

      const [ordersRes, summaryRes] = await Promise.all([
        fetch(`/api/admin/orders?${params}`),
        fetch('/api/admin/orders/summary'),
      ]);
      const ordersJson = await ordersRes.json();
      const summaryJson = await summaryRes.json();

      if (ordersJson.ok) {
        setOrders(ordersJson.data.items);
        setPagination(ordersJson.data.pagination);
      }
      if (summaryJson.ok) {
        setSummary(summaryJson.data);
      }
    } catch {
      toast.error('خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, toast]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!confirm(`هل أنت متأكد من تغيير حالة الطلب إلى ${statusLabels[newStatus] || newStatus}؟`)) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم تحديث حالة الطلب');
        fetchOrders();
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
      <Heading size="lg">إدارة الطلبات</Heading>

      {/* Summary cards */}
      {summary && (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3}>
          {Object.entries(summary.byStatus).map(([status, count]) => (
            <Box key={status} bg="white" p={3} borderRadius="lg" borderWidth="1px">
              <Text fontSize="xs" color="gray.500">{statusLabels[status] || status}</Text>
              <Text fontSize="xl" fontWeight="bold">{count}</Text>
            </Box>
          ))}
          <Box bg="white" p={3} borderRadius="lg" borderWidth="1px" borderColor="green.200">
            <Text fontSize="xs" color="gray.500">إجمالي الإيرادات</Text>
            <Text fontSize="xl" fontWeight="bold" color="green.600">{summary.totalRevenue.toLocaleString()} ل.س</Text>
          </Box>
        </SimpleGrid>
      )}

      {/* Filters */}
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="بحث..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          maxW="300px"
          bg="white"
        />
        <select style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '14px' }}
          value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : orders.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>📦</Text>
            <Text color="gray.500">لا يوجد طلبات</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>رقم الطلب</Table.ColumnHeader>
                <Table.ColumnHeader>العميل</Table.ColumnHeader>
                <Table.ColumnHeader>البائع</Table.ColumnHeader>
                <Table.ColumnHeader>المبلغ</Table.ColumnHeader>
                <Table.ColumnHeader>العمولة</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {orders.map((order) => (
                <Fragment key={order.id}>
                  <Table.Row cursor="pointer" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
                    <Table.Cell>
                      <Text fontSize="xs" fontFamily="mono">{order.id.slice(-8)}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <VStack gap={0} align="start">
                        <Text fontSize="sm">{order.customer.name || '—'}</Text>
                        <Text fontSize="xs" color="gray.500">{order.customer.email}</Text>
                      </VStack>
                    </Table.Cell>
                    <Table.Cell><Text fontSize="xs">{order.seller?.storeName || '—'}</Text></Table.Cell>
                    <Table.Cell><Text fontSize="sm" fontWeight="medium">{order.total.toLocaleString()} ل.س</Text></Table.Cell>
                    <Table.Cell><Text fontSize="xs" color="gray.500">{order.commissionTotal.toLocaleString()} ل.س</Text></Table.Cell>
                    <Table.Cell>
                      <Badge colorScheme={statusColors[order.status] || 'gray'}>
                        {statusLabels[order.status] || order.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text fontSize="xs">{new Date(order.createdAt).toLocaleDateString('ar-SY')}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1} flexWrap="wrap">
                        {(statusFlow[order.status] || []).map((next) => (
                          <Button key={next} size="xs"
                            colorScheme={next === 'CANCELLED' ? 'red' : 'blue'}
                            variant={next === 'CANCELLED' ? 'outline' : 'solid'}
                            disabled={actionLoading === order.id}
                            onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, next); }}>
                            {statusLabels[next]}
                          </Button>
                        ))}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                  {expandedOrder === order.id && (
                    <Table.Row>
                      <Table.Cell colSpan={8}>
                        <Box p={3} bg="gray.50" borderRadius="md">
                          <Text fontSize="sm" fontWeight="bold" mb={2}>عناصر الطلب:</Text>
                          {order.items.map((item) => (
                            <HStack key={item.id} justify="space-between" py={1}>
                              <Text fontSize="sm">{item.product.title}</Text>
                              <Text fontSize="sm">{item.quantity} × {item.price.toLocaleString()} ل.س</Text>
                            </HStack>
                          ))}
                        </Box>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Fragment>
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
