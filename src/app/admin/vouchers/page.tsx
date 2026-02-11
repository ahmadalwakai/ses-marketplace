'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Badge,
  Spinner,
  Textarea,
  SimpleGrid,
} from '@chakra-ui/react';
import { useAppToast } from '@/components/Toast';

// ============================================
// TYPES
// ============================================

interface GeneratedResult {
  generated: number;
  codes: string[];
  warning: string;
}

interface VoucherItem {
  id: string;
  codeLast4: string;
  value: number;
  currency: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  usedAt: string | null;
  note: string | null;
  usedByEmail: string | null;
  usedByName: string | null;
  createdByEmail: string | null;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

// ============================================
// ADMIN VOUCHERS PAGE
// ============================================

export default function AdminVouchersPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'generate' | 'list'>('generate');

  if (!session) {
    return (
      <Container maxW="container.xl" py={8}>
        <HStack justifyContent="center" py={20}>
          <Spinner size="lg" />
        </HStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack gap={6} align="stretch">
        <Heading size="lg">🎁 إدارة القسائم</Heading>

        {/* Tab Buttons */}
        <HStack gap={2}>
          <Button
            size="sm"
            variant={activeTab === 'generate' ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => setActiveTab('generate')}
          >
            إنشاء قسائم
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'list' ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => setActiveTab('list')}
          >
            قائمة القسائم
          </Button>
        </HStack>

        {activeTab === 'generate' ? <GenerateTab /> : <ListTab />}
      </VStack>
    </Container>
  );
}

// ============================================
// GENERATE TAB
// ============================================

function GenerateTab() {
  const toast = useAppToast();
  const [count, setCount] = useState('1');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);

  const handleGenerate = async () => {
    const countNum = parseInt(count, 10);
    const valueNum = parseFloat(value);

    if (!countNum || countNum < 1 || countNum > 5000) {
      toast.error('العدد يجب أن يكون بين 1 و 5000');
      return;
    }
    if (!valueNum || valueNum <= 0) {
      toast.error('القيمة يجب أن تكون أكبر من صفر');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        count: countNum,
        value: valueNum,
        currency: currency || 'USD',
      };
      if (expiresAt) {
        body.expiresAt = new Date(expiresAt).toISOString();
      }
      if (note.trim()) {
        body.note = note.trim();
      }

      const res = await fetch('/api/admin/vouchers/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message ?? 'فشل في إنشاء القسائم');
        return;
      }

      setResult(data.data);
      toast.success(`تم إنشاء ${data.data.generated} قسيمة بنجاح`);
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    // Escape CSV fields that might contain special characters
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const csv = [
      'Code,Value,Currency',
      ...result.codes.map((c) => `${escapeCSV(c)},${escapeCSV(value)},${escapeCSV(currency)}`),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <VStack gap={6} align="stretch">
      <Box
        bg="white"
        borderWidth={2}
        borderColor="black"
        borderRadius="xl"
        boxShadow="4px 4px 0 0 black"
        p={6}
      >
        <VStack gap={4} align="stretch">
          <Heading size="md">إنشاء قسائم جديدة</Heading>

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <Text fontWeight="bold" mb={1}>العدد (1-5000)</Text>
              <Input
                type="number"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                min={1}
                max={5000}
                placeholder="1"
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={1}>القيمة</Text>
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                min={0.01}
                step={0.01}
                placeholder="10.00"
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={1}>العملة</Text>
              <Input
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={1}>تاريخ الانتهاء (اختياري)</Text>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </Box>
          </SimpleGrid>

          <Box>
            <Text fontWeight="bold" mb={1}>ملاحظة (اختياري)</Text>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ملاحظة للمراجعة الداخلية..."
              maxLength={500}
            />
          </Box>

          <Button
            colorPalette="green"
            onClick={handleGenerate}
            disabled={loading}
            size="lg"
          >
            {loading ? <Spinner size="sm" /> : 'إنشاء القسائم'}
          </Button>
        </VStack>
      </Box>

      {/* Generated Codes Result */}
      {result && (
        <Box
          bg="yellow.50"
          borderWidth={2}
          borderColor="orange.400"
          borderRadius="xl"
          p={6}
        >
          <VStack gap={4} align="stretch">
            <HStack justifyContent="space-between" flexWrap="wrap">
              <Heading size="md" color="orange.700">
                ⚠️ الأكواد المُنشأة ({result.generated})
              </Heading>
              <Button colorPalette="blue" size="sm" onClick={handleDownloadCSV}>
                📥 تنزيل CSV
              </Button>
            </HStack>

            <Box
              bg="red.50"
              borderWidth={1}
              borderColor="red.300"
              borderRadius="md"
              p={3}
            >
              <Text color="red.700" fontWeight="bold" fontSize="sm">
                ⚠️ لن يتم عرض هذه الأكواد مرة أخرى! قم بتنزيلها الآن.
              </Text>
            </Box>

            <Box maxH="400px" overflowY="auto">
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>#</Table.ColumnHeader>
                    <Table.ColumnHeader>الكود</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {result.codes.map((code, i) => (
                    <Table.Row key={i}>
                      <Table.Cell>{i + 1}</Table.Cell>
                      <Table.Cell fontFamily="mono" fontSize="sm">
                        {code}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </VStack>
        </Box>
      )}
    </VStack>
  );
}

// ============================================
// LIST TAB
// ============================================

function ListTab() {
  const toast = useAppToast();
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      params.set('take', String(PAGE_SIZE));
      params.set('skip', String(page * PAGE_SIZE));

      const res = await fetch(`/api/admin/vouchers/list?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message ?? 'فشل في تحميل القسائم');
        return;
      }
      setVouchers(data.data.items);
      setPagination(data.data.pagination);
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, toast]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleDisable = async (voucherId: string) => {
    try {
      const res = await fetch('/api/admin/vouchers/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voucherId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message ?? 'فشل في تعطيل القسيمة');
        return;
      }
      toast.success('تم تعطيل القسيمة');
      fetchVouchers();
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'green';
      case 'USED': return 'blue';
      case 'DISABLED': return 'red';
      case 'EXPIRED': return 'gray';
      default: return 'gray';
    }
  };

  return (
    <VStack gap={4} align="stretch">
      {/* Filters */}
      <HStack gap={2} flexWrap="wrap">
        <Text fontWeight="bold">حالة:</Text>
        {['', 'ACTIVE', 'USED', 'DISABLED', 'EXPIRED'].map((s) => (
          <Button
            key={s}
            size="xs"
            variant={statusFilter === s ? 'solid' : 'outline'}
            colorPalette="blue"
            onClick={() => { setStatusFilter(s); setPage(0); }}
          >
            {s || 'الكل'}
          </Button>
        ))}
      </HStack>

      {/* Table */}
      <Box
        bg="white"
        borderWidth={2}
        borderColor="black"
        borderRadius="xl"
        boxShadow="4px 4px 0 0 black"
        overflow="auto"
      >
        {loading ? (
          <HStack justifyContent="center" py={10}>
            <Spinner size="lg" />
          </HStack>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>آخر 4</Table.ColumnHeader>
                <Table.ColumnHeader>القيمة</Table.ColumnHeader>
                <Table.ColumnHeader>العملة</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ الإنشاء</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ الانتهاء</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ الاستخدام</Table.ColumnHeader>
                <Table.ColumnHeader>المستخدم</Table.ColumnHeader>
                <Table.ColumnHeader>إجراء</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {vouchers.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={9}>
                    <Text textAlign="center" color="gray.500" py={4}>
                      لا توجد قسائم
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                vouchers.map((v) => (
                  <Table.Row key={v.id}>
                    <Table.Cell fontFamily="mono">****{v.codeLast4}</Table.Cell>
                    <Table.Cell>{v.value}</Table.Cell>
                    <Table.Cell>{v.currency}</Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette={statusColor(v.status)} size="sm">
                        {v.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {new Date(v.createdAt).toLocaleDateString('ar')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {v.expiresAt ? new Date(v.expiresAt).toLocaleDateString('ar') : '—'}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {v.usedAt ? new Date(v.usedAt).toLocaleDateString('ar') : '—'}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {v.usedByEmail ?? '—'}
                    </Table.Cell>
                    <Table.Cell>
                      {v.status === 'ACTIVE' && (
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => handleDisable(v.id)}
                        >
                          تعطيل
                        </Button>
                      )}
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <HStack justifyContent="center" gap={2}>
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            السابق
          </Button>
          <Text fontSize="sm">
            صفحة {page + 1} من {pagination.totalPages}
          </Text>
          <Button
            size="sm"
            variant="outline"
            disabled={!pagination.hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            التالي
          </Button>
        </HStack>
      )}
    </VStack>
  );
}
