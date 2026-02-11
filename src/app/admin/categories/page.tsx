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

interface CategoryData {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  parent?: { id: string; name: string } | null;
  _count: { products: number; children: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function AdminCategoriesPage() {
  const toast = useAppToast();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // New category form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newNameAr, setNewNameAr] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNameAr, setEditNameAr] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsActive, setEditIsActive] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/categories?page=${page}&limit=50`);
      const json = await res.json();
      if (json.ok) {
        setCategories(json.data.items);
        setPagination(json.data.pagination);
      }
    } catch {
      toast.error('خطأ في تحميل التصنيفات');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const createCategory = async () => {
    if (!newName || !newSlug) { toast.warning('الاسم والرابط مطلوبان'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, nameAr: newNameAr || undefined, slug: newSlug }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم إنشاء التصنيف');
        setNewName(''); setNewNameAr(''); setNewSlug(''); setShowForm(false);
        fetchCategories();
      } else {
        toast.error(json.error?.message || 'فشل الإنشاء');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (cat: CategoryData) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditNameAr(cat.nameAr || '');
    setEditSortOrder(cat.sortOrder);
    setEditIsActive(cat.isActive);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setActionLoading(editingId);
    try {
      const res = await fetch(`/api/admin/categories/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, nameAr: editNameAr || undefined, sortOrder: editSortOrder, isActive: editIsActive }),
      });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم تحديث التصنيف');
        setEditingId(null);
        fetchCategories();
      } else {
        toast.error(json.error?.message || 'فشل التحديث');
      }
    } catch {
      toast.error('خطأ في الاتصال');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟ لن يمكنك الحذف إذا كانت هناك منتجات أو تصنيفات فرعية.')) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.ok) {
        toast.success('تم حذف التصنيف');
        fetchCategories();
      } else {
        toast.error(json.error?.message || 'فشل الحذف');
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
        <Heading size="lg">إدارة التصنيفات</Heading>
        <Button colorScheme="blue" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'إلغاء' : '+ إضافة تصنيف'}
        </Button>
      </HStack>

      {/* Create form */}
      {showForm && (
        <Box bg="white" p={4} borderRadius="lg" borderWidth="1px">
          <VStack gap={3} align="stretch">
            <Heading size="sm">تصنيف جديد</Heading>
            <HStack gap={3} flexWrap="wrap">
              <Input placeholder="الاسم (EN)" value={newName} onChange={(e) => setNewName(e.target.value)} maxW="200px" />
              <Input placeholder="الاسم (AR)" value={newNameAr} onChange={(e) => setNewNameAr(e.target.value)} maxW="200px" />
              <Input placeholder="الرابط (slug)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} maxW="200px" />
              <Button colorScheme="blue" size="sm" onClick={createCategory} disabled={creating}>
                {creating ? <Spinner size="sm" /> : 'إنشاء'}
              </Button>
            </HStack>
          </VStack>
        </Box>
      )}

      {/* Table */}
      <Box bg="white" borderRadius="lg" borderWidth="1px" overflow="auto">
        {loading ? (
          <Box p={10} textAlign="center"><Spinner size="lg" /></Box>
        ) : categories.length === 0 ? (
          <Box p={10} textAlign="center">
            <Text fontSize="3xl" mb={2}>📂</Text>
            <Text color="gray.500">لا يوجد تصنيفات</Text>
            <Button mt={3} colorScheme="blue" size="sm" onClick={() => setShowForm(true)}>إضافة أول تصنيف</Button>
          </Box>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>التصنيف</Table.ColumnHeader>
                <Table.ColumnHeader>الرابط</Table.ColumnHeader>
                <Table.ColumnHeader>الترتيب</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>المنتجات</Table.ColumnHeader>
                <Table.ColumnHeader>الأب</Table.ColumnHeader>
                <Table.ColumnHeader>إجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {categories.map((cat) => (
                <Table.Row key={cat.id}>
                  <Table.Cell>
                    {editingId === cat.id ? (
                      <VStack gap={1} align="start">
                        <Input size="xs" value={editName} onChange={(e) => setEditName(e.target.value)} />
                        <Input size="xs" value={editNameAr} onChange={(e) => setEditNameAr(e.target.value)} placeholder="AR" />
                      </VStack>
                    ) : (
                      <VStack gap={0} align="start">
                        <Text fontWeight="medium" fontSize="sm">{cat.name}</Text>
                        {cat.nameAr && <Text fontSize="xs" color="gray.500">{cat.nameAr}</Text>}
                      </VStack>
                    )}
                  </Table.Cell>
                  <Table.Cell><Text fontSize="xs" color="gray.500">{cat.slug}</Text></Table.Cell>
                  <Table.Cell>
                    {editingId === cat.id ? (
                      <Input size="xs" type="number" value={editSortOrder} onChange={(e) => setEditSortOrder(Number(e.target.value))} w="60px" />
                    ) : (
                      <Text fontSize="sm">{cat.sortOrder}</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {editingId === cat.id ? (
                      <Button size="xs" colorScheme={editIsActive ? 'green' : 'gray'} onClick={() => setEditIsActive(!editIsActive)}>
                        {editIsActive ? 'نشط' : 'غير نشط'}
                      </Button>
                    ) : (
                      <Badge colorScheme={cat.isActive ? 'green' : 'gray'}>
                        {cat.isActive ? 'نشط' : 'غير نشط'}
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>{cat._count.products}</Table.Cell>
                  <Table.Cell><Text fontSize="xs">{cat.parent?.name || '—'}</Text></Table.Cell>
                  <Table.Cell>
                    {editingId === cat.id ? (
                      <HStack gap={1}>
                        <Button size="xs" colorScheme="blue" onClick={saveEdit} disabled={actionLoading === cat.id}>حفظ</Button>
                        <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>إلغاء</Button>
                      </HStack>
                    ) : (
                      <HStack gap={1}>
                        <Button size="xs" variant="outline" onClick={() => startEdit(cat)}>تعديل</Button>
                        <Button size="xs" colorScheme="red" variant="outline"
                          disabled={actionLoading === cat.id || cat._count.products > 0 || cat._count.children > 0}
                          onClick={() => deleteCategory(cat.id)}>
                          حذف
                        </Button>
                      </HStack>
                    )}
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
