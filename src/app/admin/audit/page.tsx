'use client';

import { useEffect, useState, useCallback, Fragment } from 'react';
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

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  admin: { name: string | null; email: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

const actionColors: Record<string, string> = {
  CREATE: 'green',
  UPDATE: 'blue',
  DELETE: 'red',
  APPROVE: 'teal',
  REJECT: 'orange',
  BAN: 'red',
  UNBAN: 'green',
  MODERATE: 'purple',
};

function getActionColor(action: string): string {
  for (const [key, color] of Object.entries(actionColors)) {
    if (action.toUpperCase().includes(key)) return color;
  }
  return 'gray';
}

export default function AdminAuditPage() {
  const toast = useAppToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entityType', entityFilter);

      const res = await fetch(`/api/admin/audit?${params}`);
      const json = await res.json();
      if (json.ok) {
        setLogs(json.data.logs);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error('خطأ في تحميل سجل المراجعة');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, toast]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <VStack gap={6} align="stretch">
      <HStack justify="space-between" flexWrap="wrap">
        <Heading size="lg">سجل المراجعة</Heading>
        {pagination && (
          <Text fontSize="sm" color="gray.500">إجمالي: {pagination.total} سجل</Text>
        )}
      </HStack>

      {/* Filters */}
      <HStack gap={3} flexWrap="wrap">
        <Input
          placeholder="تصفية حسب الإجراء..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          maxW="250px"
          bg="white"
        />
        <Input
          placeholder="تصفية حسب نوع الكيان..."
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          maxW="250px"
          bg="white"
        />
      </HStack>

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : logs.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>📋</Text>
            <Text color="gray.500">لا يوجد سجلات مراجعة</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                <Table.ColumnHeader>المشرف</Table.ColumnHeader>
                <Table.ColumnHeader>الإجراء</Table.ColumnHeader>
                <Table.ColumnHeader>نوع الكيان</Table.ColumnHeader>
                <Table.ColumnHeader>معرّف الكيان</Table.ColumnHeader>
                <Table.ColumnHeader>التفاصيل</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.map((log) => (
                <Fragment key={log.id}>
                  <Table.Row cursor="pointer" onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}>
                    <Table.Cell>
                      <Text fontSize="xs">{new Date(log.createdAt).toLocaleString('ar-SY')}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <VStack gap={0} align="start">
                        <Text fontSize="sm">{log.admin?.name || '—'}</Text>
                        <Text fontSize="xs" color="gray.500">{log.admin?.email}</Text>
                      </VStack>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorScheme={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell><Text fontSize="xs">{log.entityType}</Text></Table.Cell>
                    <Table.Cell>
                      <Text fontSize="xs" fontFamily="mono">{log.entityId?.slice(-8) || '—'}</Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setExpandedLog(expandedLog === log.id ? null : log.id); }}>
                        {expandedLog === log.id ? '▲' : '▼'}
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                  {expandedLog === log.id && (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Box p={3} bg="gray.50" borderRadius="md" maxH="200px" overflowY="auto">
                          <Text fontSize="xs" fontFamily="mono" whiteSpace="pre-wrap">
                            {JSON.stringify(log.metadata, null, 2)}
                          </Text>
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
