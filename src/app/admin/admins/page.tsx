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

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export default function AdminAdminsPage() {
  const toast = useAppToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Promote form
  const [showPromote, setShowPromote] = useState(false);
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoting, setPromoting] = useState(false);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      if (json.ok) {
        setAdmins(json.data);
      }
    } catch {
      toast.error('خطأ في تحميل المشرفين');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  const promoteAdmin = async () => {
    if (!promoteEmail) { toast.warning('البريد الإلكتروني مطلوب'); return; }
    setPromoting(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: promoteEmail }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم ترقية المستخدم إلى مشرف');
        setPromoteEmail('');
        setShowPromote(false);
        fetchAdmins();
      } else {
        toast.error(json.error?.message || 'فشل الترقية');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setPromoting(false);
    }
  };

  const demoteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`هل أنت متأكد من إزالة صلاحيات المشرف من ${email}؟`)) return;
    setActionLoading(adminId);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم إزالة صلاحيات المشرف');
        fetchAdmins();
      } else {
        toast.error(json.error?.message || 'فشل الإزالة');
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
        <Heading size="lg">إدارة المشرفين</Heading>
        <Button colorScheme="blue" size="sm" onClick={() => setShowPromote(!showPromote)}>
          {showPromote ? 'إلغاء' : '+ إضافة مشرف'}
        </Button>
      </HStack>

      {/* Promote form */}
      {showPromote && (
        <Box bg="white" p={4} borderRadius="lg" borderWidth="1px">
          <VStack gap={3} align="stretch">
            <Heading size="sm">ترقية مستخدم إلى مشرف</Heading>
            <Text fontSize="sm" color="gray.500">
              أدخل البريد الإلكتروني لمستخدم مسجَّل لترقيته. إذا لم يكن مسجلاً، سيتم إرسال دعوة.
            </Text>
            <HStack gap={3}>
              <Input
                placeholder="البريد الإلكتروني"
                value={promoteEmail}
                onChange={(e) => setPromoteEmail(e.target.value)}
                maxW="300px"
              />
              <Button colorScheme="blue" size="sm" onClick={promoteAdmin} disabled={promoting}>
                {promoting ? <Spinner size="sm" /> : 'ترقية'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : admins.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>🛡️</Text>
            <Text color="gray.500">لا يوجد مشرفون</Text>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>المشرف</Table.ColumnHeader>
                <Table.ColumnHeader>البريد</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>تاريخ الانضمام</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {admins.map((admin) => (
                <Table.Row key={admin.id}>
                  <Table.Cell>
                    <HStack gap={2}>
                      <Box w="32px" h="32px" borderRadius="full" bg="blue.100" display="flex" alignItems="center" justifyContent="center">
                        <Text fontSize="sm">🛡️</Text>
                      </Box>
                      <Text fontWeight="medium" fontSize="sm">{admin.name || '—'}</Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell><Text fontSize="sm">{admin.email}</Text></Table.Cell>
                  <Table.Cell>
                    <Badge colorScheme={admin.status === 'ACTIVE' ? 'green' : 'orange'}>
                      {admin.status}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="xs">{new Date(admin.createdAt).toLocaleDateString('ar-SY')}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      disabled={actionLoading === admin.id || admins.length <= 1}
                      onClick={() => demoteAdmin(admin.id, admin.email)}
                    >
                      إزالة صلاحيات
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>

      <Box bg="blue.50" p={4} borderRadius="lg">
        <Text fontSize="sm" color="blue.700">
          💡 لا يمكنك إزالة صلاحياتك الخاصة أو إزالة آخر مشرف في النظام.
        </Text>
      </Box>
    </VStack>
  );
}
