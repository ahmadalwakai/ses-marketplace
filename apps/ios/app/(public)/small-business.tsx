import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { apiClient } from '../../src/lib/api/client';
import { colors, spacing, typography, radii } from '../../src/theme/tokens';

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  slug: string;
  price: number;
  currency: string;
  condition: string;
  ratingAvg: number;
  ratingCount: number;
  images: { url: string; alt?: string }[];
  seller: { id: string; storeName: string; slug: string; ratingAvg: number };
  category: { id: string; name: string; nameAr?: string; slug: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const conditionLabels: Record<string, string> = {
  NEW: 'جديد',
  LIKE_NEW: 'شبه جديد',
  GOOD: 'جيد',
  FAIR: 'مقبول',
  POOR: 'مستعمل',
};

export default function SmallBusiness() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchProducts = useCallback(async (pageNum: number, query?: string, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('smallBusiness', 'true');
      params.set('page', String(pageNum));
      params.set('limit', '20');
      if (query) params.set('q', query);

      const res = await apiClient.get<{
        success: boolean;
        data: Product[];
        pagination: Pagination;
      }>(`/api/products?${params.toString()}`);

      if (res.data.success) {
        if (append) {
          setProducts((prev) => [...prev, ...res.data.data]);
        } else {
          setProducts(res.data.data);
        }
        setPagination(res.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching small business products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts(1, search);
  };

  const handleLoadMore = () => {
    if (pagination && page < pagination.totalPages && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, search, true);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/(public)/products/${item.slug}`)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0].url }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={{ fontSize: 32 }}>📷</Text>
          </View>
        )}
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅ بائع موثق</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.titleAr || item.title}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            {Number(item.price).toLocaleString()} {item.currency}
          </Text>
          <Text style={styles.conditionBadge}>
            {conditionLabels[item.condition] || item.condition}
          </Text>
        </View>
        {item.seller && (
          <Text style={styles.sellerName} numberOfLines={1}>
            🏪 {item.seller.storeName}
          </Text>
        )}
        {item.ratingCount > 0 && (
          <Text style={styles.rating}>
            ★ {item.ratingAvg.toFixed(1)} ({item.ratingCount})
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View style={{ gap: spacing.md }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={{ fontSize: 40 }}>🏪</Text>
        <Text style={styles.heroTitle}>أعمال صغيرة</Text>
        <Text style={styles.heroSubtitle}>
          ادعم الأعمال الصغيرة والبائعين الموثقين في سوريا
        </Text>
        <Text style={styles.heroEn}>Small Business — Support verified local sellers</Text>
      </View>

      {/* Search */}
      <Card>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث في الأعمال الصغيرة..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            textAlign="right"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>بحث</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* Features */}
      <View style={styles.featuresRow}>
        <View style={styles.featureBox}>
          <Text style={{ fontSize: 24 }}>✅</Text>
          <Text style={styles.featureLabel}>بائعون موثقون</Text>
        </View>
        <View style={styles.featureBox}>
          <Text style={{ fontSize: 24 }}>🤝</Text>
          <Text style={styles.featureLabel}>ادعم المحلي</Text>
        </View>
        <View style={styles.featureBox}>
          <Text style={{ fontSize: 24 }}>⭐</Text>
          <Text style={styles.featureLabel}>جودة مضمونة</Text>
        </View>
      </View>

      {/* Count */}
      {pagination && (
        <Text style={styles.countText}>{pagination.total} منتج من بائعين معتمدين</Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={{ paddingVertical: spacing.lg }}>
          <ActivityIndicator color="#16a34a" />
        </View>
      );
    }
    return null;
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <Card>
        <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg }}>
          <Text style={{ fontSize: 48 }}>🏪</Text>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>
            لا توجد منتجات حالياً
          </Text>
          <Text style={{ fontSize: typography.body, color: '#6b7280', textAlign: 'center' }}>
            لم يتم العثور على منتجات من الأعمال الصغيرة. جرب تغيير البحث.
          </Text>
          <Button
            title="تصفح جميع المنتجات"
            onPress={() => router.push('/(public)/products')}
          />
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <Screen>
        {renderHeader()}
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={{ color: '#6b7280', marginTop: spacing.sm }}>جاري تحميل المنتجات...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      renderItem={renderProduct}
      numColumns={2}
      columnWrapperStyle={{ gap: spacing.sm }}
      contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmpty}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.3}
    />
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  heroTitle: {
    fontSize: typography.heading + 6,
    fontWeight: '700',
    color: '#16a34a',
  },
  heroSubtitle: {
    fontSize: typography.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  heroEn: {
    fontSize: typography.body - 2,
    color: '#9ca3af',
    textAlign: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  searchButton: {
    backgroundColor: '#16a34a',
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: typography.body,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  featureBox: {
    alignItems: 'center',
    gap: spacing.xs,
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: radii.md,
    paddingVertical: spacing.md,
  },
  featureLabel: {
    fontSize: typography.body - 2,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  countText: {
    fontSize: typography.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  productCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: radii.md,
    backgroundColor: colors.background,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  imageContainer: {
    height: 140,
    backgroundColor: '#f3f4f6',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#16a34a',
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: spacing.sm,
    gap: 4,
  },
  productTitle: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: typography.body,
    fontWeight: '700',
    color: '#16a34a',
  },
  conditionBadge: {
    fontSize: 10,
    color: '#16a34a',
    borderWidth: 1,
    borderColor: '#16a34a',
    borderRadius: radii.sm,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  sellerName: {
    fontSize: typography.body - 2,
    color: '#6b7280',
    textAlign: 'right',
  },
  rating: {
    fontSize: typography.body - 2,
    color: '#eab308',
  },
});
