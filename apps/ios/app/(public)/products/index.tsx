import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../../src/lib/api/client';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { Screen } from '../../../src/components/layout/Screen';
import { colors, spacing, typography, radii } from '../../../src/theme/tokens';

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  price?: number;
  ratingAvg?: number;
  condition?: string;
  seller?: { storeName: string };
  category?: { name: string; nameAr?: string };
}

export default function ProductsList() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; advanced?: string }>();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [showAdvanced, setShowAdvanced] = useState(params.advanced === 'true');

  // Advanced filter state
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('relevance');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (query?: string) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (query || searchQuery) searchParams.set('q', query || searchQuery);
      if (minPrice) searchParams.set('minPrice', minPrice);
      if (maxPrice) searchParams.set('maxPrice', maxPrice);
      if (condition) searchParams.set('condition', condition);
      if (sort) searchParams.set('sort', sort);

      const url = `/api/search?${searchParams.toString()}`;
      const { data } = await apiClient.get<{ success: boolean; data: Product[] }>(url);
      const items = Array.isArray(data) ? data : (data as any)?.data || [];
      setProducts(items);
    } catch {
      // API error handled silently
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadProducts(searchQuery);
  };

  const handleApplyFilters = () => {
    loadProducts(searchQuery);
  };

  const conditionOptions = [
    { value: '', label: 'الكل' },
    { value: 'NEW', label: 'جديد' },
    { value: 'LIKE_NEW', label: 'كالجديد' },
    { value: 'GOOD', label: 'جيد' },
    { value: 'FAIR', label: 'مقبول' },
  ];

  const sortOptions = [
    { value: 'relevance', label: 'الأكثر صلة' },
    { value: 'newest', label: 'الأحدث' },
    { value: 'price_asc', label: 'الأقل سعراً' },
    { value: 'price_desc', label: 'الأعلى سعراً' },
    { value: 'rating', label: 'التقييم' },
  ];

  return (
    <Screen scroll={false}>
      {/* Search Header */}
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.xs }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          ابحث عن أي شيء
        </Text>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن أي شيء..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>🔍</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => setShowAdvanced(!showAdvanced)}>
          <Text style={styles.advancedToggle}>
            {showAdvanced ? '▲ إخفاء بحث متقدم' : '▼ بحث متقدم'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>
              بحث متقدم
            </Text>

            {/* Price Range */}
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>الحد الأدنى</Text>
                <TextInput
                  style={styles.filterInput}
                  value={minPrice}
                  onChangeText={setMinPrice}
                  placeholder="0"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.filterLabel}>الحد الأقصى</Text>
                <TextInput
                  style={styles.filterInput}
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  placeholder="999999"
                  keyboardType="numeric"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Condition */}
            <Text style={styles.filterLabel}>الحالة</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {conditionOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, condition === opt.value && styles.chipActive]}
                  onPress={() => setCondition(opt.value)}
                >
                  <Text style={[styles.chipText, condition === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort */}
            <Text style={styles.filterLabel}>ترتيب حسب</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {sortOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, sort === opt.value && styles.chipActive]}
                  onPress={() => setSort(opt.value)}
                >
                  <Text style={[styles.chipText, sort === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="تطبيق الفلاتر" onPress={handleApplyFilters} />
          </View>
        </Card>
      )}

      {/* Products List */}
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
              <Text style={{ color: '#6b7280', fontSize: typography.body }}>لا توجد منتجات</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(public)/products/${item.slug}` as const)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>
                    {item.titleAr || item.title}
                  </Text>
                  {item.category && (
                    <Text style={{ color: '#6b7280', fontSize: typography.small }}>
                      {item.category.nameAr || item.category.name}
                    </Text>
                  )}
                  {item.seller && (
                    <Text style={{ color: '#6b7280', fontSize: typography.small }}>{item.seller.storeName}</Text>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    {item.price != null && (
                      <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '700' }}>
                        {item.price.toLocaleString()} ل.س
                      </Text>
                    )}
                    {item.ratingAvg != null && (
                      <Text style={{ color: '#eab308', fontSize: typography.small }}>
                        ★ {Number(item.ratingAvg).toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  searchBtn: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: {
    fontSize: 20,
  },
  advancedToggle: {
    color: '#6b7280',
    fontSize: typography.body,
    textAlign: 'center',
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.text,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: colors.text,
  },
  chipText: {
    color: colors.text,
    fontSize: typography.small,
  },
  chipTextActive: {
    color: colors.background,
  },
});
