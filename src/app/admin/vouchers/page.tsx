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

interface GeneratedMeta {
  batchName: string;
  distributorName: string;
}

interface PrintConfig {
  template: 'dark' | 'light' | 'antifraud';
  layout: '1' | '2' | '4' | '8';
  includeQr: '0' | '1';
  language: 'en' | 'ar' | 'both';
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
  distributorName: string | null;
  batchId: string | null;
  batchName: string | null;
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
  const { data: session } = useSession();
  const [count, setCount] = useState('1');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [genMeta, setGenMeta] = useState<GeneratedMeta>({ batchName: '', distributorName: '' });
  const [batchName, setBatchName] = useState('');
  const [distributorName, setDistributorName] = useState('');
  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    template: 'dark',
    layout: '4',
    includeQr: '1',
    language: 'both',
  });
  const [printLoading, setPrintLoading] = useState(false);

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
      if (batchName.trim()) {
        body.batchName = batchName.trim();
      }
      if (distributorName.trim()) {
        body.distributorName = distributorName.trim();
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
      setGenMeta({ batchName: batchName.trim(), distributorName: distributorName.trim() });
      toast.success(`تم إنشاء ${data.data.generated} قسيمة بنجاح`);
    } catch {
      toast.error('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const isAdmin = (session?.user as { role?: string } | undefined)?.role === 'ADMIN';
    if (!isAdmin) {
      toast.error('يتطلب صلاحية المسؤول لتصدير الأكواد الكاملة');
      return;
    }
    const confirmed = window.confirm(
      'تحذير: سيتم تصدير الأكواد الكاملة. هل أنت متأكد؟\n\nWarning: Full codes will be exported. Are you sure?'
    );
    if (!confirmed) return;
    // Escape CSV fields that might contain special characters
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const csv = [
      'Code,Value,Currency,Batch,Distributor',
      ...result.codes.map((c) =>
        `${escapeCSV(c)},${escapeCSV(value)},${escapeCSV(currency)},${escapeCSV(genMeta.batchName)},${escapeCSV(genMeta.distributorName)}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadMaskedCSV = () => {
    if (!result) return;
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const csv = [
      'Last4,Value,Currency,Batch,Distributor',
      ...result.codes.map((c) =>
        `${escapeCSV('****' + c.slice(-4))},${escapeCSV(value)},${escapeCSV(currency)},${escapeCSV(genMeta.batchName)},${escapeCSV(genMeta.distributorName)}`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-masked-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setPrintLoading(true);
    try {
      const params = new URLSearchParams({
        template: printConfig.template,
        layout: printConfig.layout,
        includeQr: printConfig.includeQr,
        language: printConfig.language,
      });
      const valueNum = parseFloat(value);
      const body = {
        codes: result.codes.map((code) => ({
          code,
          value: valueNum,
          currency: currency || 'USD',
        })),
        batchName: genMeta.batchName || null,
      };
      const res = await fetch(`/api/admin/vouchers/print?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error?.message ?? 'فشل في إنشاء PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ses-vouchers-${printConfig.template}-${printConfig.layout}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تنزيل ملف PDF');
    } catch {
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setPrintLoading(false);
    }
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

          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <Text fontWeight="bold" mb={1}>اسم الدفعة (اختياري)</Text>
              <Input
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="Damascus-Jan-2026-10USD"
                maxLength={200}
              />
            </Box>
            <Box>
              <Text fontWeight="bold" mb={1}>اسم الموزع (اختياري)</Text>
              <Input
                value={distributorName}
                onChange={(e) => setDistributorName(e.target.value)}
                placeholder="اسم الموزع أو الوكيل"
                maxLength={200}
              />
            </Box>
          </SimpleGrid>

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
            <HStack justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Heading size="md" color="orange.700">
                ⚠️ الأكواد المُنشأة ({result.generated})
              </Heading>
              <HStack gap={2}>
                <Button colorPalette="teal" size="sm" onClick={handleDownloadMaskedCSV}>
                  📥 CSV (مقنّع)
                </Button>
                <Button colorPalette="red" size="sm" onClick={handleDownloadCSV}>
                  📥 CSV (كامل)
                </Button>
              </HStack>
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

      {/* Print PDF Panel — visible only when codes exist in memory */}
      {result && (
        <Box
          bg="white"
          borderWidth={2}
          borderColor="black"
          borderRadius="xl"
          boxShadow="4px 4px 0 0 black"
          p={6}
        >
          <VStack gap={4} align="stretch">
            <Heading size="md">🖨️ طباعة بطاقات PDF</Heading>
            <Text fontSize="sm" color="gray.600">
              يتم تضمين الأكواد الكاملة في ملف PDF — متاحة فقط أثناء هذه الجلسة.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
              <Box>
                <Text fontWeight="bold" mb={1}>القالب</Text>
                <HStack gap={2}>
                  {(['dark', 'light', 'antifraud'] as const).map((t) => (
                    <Button
                      key={t}
                      size="xs"
                      variant={printConfig.template === t ? 'solid' : 'outline'}
                      colorPalette="blue"
                      onClick={() => setPrintConfig((p) => ({ ...p, template: t }))}
                    >
                      {t === 'dark' ? 'داكن' : t === 'light' ? 'فاتح' : 'مضاد للتزوير'}
                    </Button>
                  ))}
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={1}>التخطيط (بطاقات/صفحة)</Text>
                <HStack gap={2}>
                  {(['1', '2', '4', '8'] as const).map((l) => (
                    <Button
                      key={l}
                      size="xs"
                      variant={printConfig.layout === l ? 'solid' : 'outline'}
                      colorPalette="blue"
                      onClick={() => setPrintConfig((p) => ({ ...p, layout: l }))}
                    >
                      {l}
                    </Button>
                  ))}
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={1}>رمز QR</Text>
                <HStack gap={2}>
                  <Button
                    size="xs"
                    variant={printConfig.includeQr === '1' ? 'solid' : 'outline'}
                    colorPalette="blue"
                    onClick={() => setPrintConfig((p) => ({ ...p, includeQr: '1' }))}
                  >
                    تضمين
                  </Button>
                  <Button
                    size="xs"
                    variant={printConfig.includeQr === '0' ? 'solid' : 'outline'}
                    colorPalette="blue"
                    onClick={() => setPrintConfig((p) => ({ ...p, includeQr: '0' }))}
                  >
                    بدون
                  </Button>
                </HStack>
              </Box>

              <Box>
                <Text fontWeight="bold" mb={1}>اللغة</Text>
                <HStack gap={2}>
                  {(['both', 'ar', 'en'] as const).map((lang) => (
                    <Button
                      key={lang}
                      size="xs"
                      variant={printConfig.language === lang ? 'solid' : 'outline'}
                      colorPalette="blue"
                      onClick={() => setPrintConfig((p) => ({ ...p, language: lang }))}
                    >
                      {lang === 'both' ? 'كلاهما' : lang === 'ar' ? 'عربي' : 'English'}
                    </Button>
                  ))}
                </HStack>
              </Box>
            </SimpleGrid>

            <Button
              colorPalette="purple"
              onClick={handleDownloadPDF}
              disabled={printLoading}
              size="lg"
            >
              {printLoading ? <Spinner size="sm" /> : '📄 تنزيل PDF للطباعة'}
            </Button>
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
  const [batchFilter, setBatchFilter] = useState('');
  const [page, setPage] = useState(0);
  const [printActiveLoading, setPrintActiveLoading] = useState(false);
  const PAGE_SIZE = 20;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (batchFilter) params.set('batchId', batchFilter);
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
  }, [statusFilter, batchFilter, page, toast]);

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

  const handlePrintActive = async () => {
    setPrintActiveLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'ACTIVE',
        take: '200',
        template: 'dark',
        layout: '8',
        includeQr: '1',
        language: 'both',
      });
      const res = await fetch(`/api/admin/vouchers/print?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error?.message ?? 'فشل في إنشاء PDF');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ses-active-vouchers-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('تم تنزيل ملف PDF للقسائم النشطة');
    } catch {
      toast.error('حدث خطأ أثناء إنشاء PDF');
    } finally {
      setPrintActiveLoading(false);
    }
  };

  const handleDisableBatch = async (batchId: string) => {
    try {
      const res = await fetch('/api/admin/vouchers/disable-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error?.message ?? 'فشل في تعطيل الدفعة');
        return;
      }
      toast.success(`تم تعطيل ${data.data.disabledCount} قسيمة في الدفعة`);
      fetchVouchers();
    } catch {
      toast.error('حدث خطأ في الاتصال');
    }
  };

  const handleExportDistributorCSV = () => {
    const escapeCSV = (field: string) => {
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };
    const csv = [
      'Last4,Value,Currency,Batch,Distributor,Status',
      ...vouchers.map((v) =>
        [
          escapeCSV(`****${v.codeLast4}`),
          String(v.value),
          escapeCSV(v.currency),
          escapeCSV(v.batchName ?? ''),
          escapeCSV(v.distributorName ?? ''),
          v.status,
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-distributor-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Collect unique batches from current vouchers for filter
  const batchOptions = vouchers.reduce<{ id: string; name: string }[]>((acc, v) => {
    if (v.batchId && v.batchName && !acc.find((b) => b.id === v.batchId)) {
      acc.push({ id: v.batchId, name: v.batchName });
    }
    return acc;
  }, []);

  return (
    <VStack gap={4} align="stretch">
      {/* Filters + Print Active */}
      <HStack gap={2} flexWrap="wrap" justifyContent="space-between">
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
        <HStack gap={2} flexWrap="wrap">
          {batchFilter && (
            <Button
              size="xs"
              variant="outline"
              colorPalette="orange"
              onClick={() => { setBatchFilter(''); setPage(0); }}
            >
              ✕ إلغاء فلتر الدفعة
            </Button>
          )}
          <Button
            size="sm"
            colorPalette="teal"
            variant="outline"
            onClick={handleExportDistributorCSV}
            disabled={vouchers.length === 0}
          >
            📥 تصدير CSV الموزع (مقنّع)
          </Button>
          <Button
            size="sm"
            colorPalette="purple"
            variant="outline"
            onClick={handlePrintActive}
            disabled={printActiveLoading}
          >
            {printActiveLoading ? <Spinner size="xs" /> : '🖨️ طباعة القسائم النشطة'}
          </Button>
        </HStack>
      </HStack>

      {/* Batch filter chips */}
      {batchOptions.length > 0 && !batchFilter && (
        <HStack gap={2} flexWrap="wrap">
          <Text fontWeight="bold" fontSize="sm">دفعة:</Text>
          {batchOptions.map((b) => (
            <Button
              key={b.id}
              size="xs"
              variant="outline"
              colorPalette="orange"
              onClick={() => { setBatchFilter(b.id); setPage(0); }}
            >
              {b.name}
            </Button>
          ))}
        </HStack>
      )}

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
                <Table.ColumnHeader>الدفعة</Table.ColumnHeader>
                <Table.ColumnHeader>الموزع</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ الإنشاء</Table.ColumnHeader>
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
                      {v.batchName ? (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => { setBatchFilter(v.batchId ?? ''); setPage(0); }}
                        >
                          {v.batchName}
                        </Button>
                      ) : '—'}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {v.distributorName ?? '—'}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {new Date(v.createdAt).toLocaleDateString('ar')}
                    </Table.Cell>
                    <Table.Cell fontSize="xs">
                      {v.usedByEmail ?? '—'}
                    </Table.Cell>
                    <Table.Cell>
                      <HStack gap={1}>
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
                        {v.status === 'ACTIVE' && v.batchId && (
                          <Button
                            size="xs"
                            colorPalette="orange"
                            variant="outline"
                            onClick={() => handleDisableBatch(v.batchId!)}
                          >
                            تعطيل الدفعة
                          </Button>
                        )}
                      </HStack>
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
