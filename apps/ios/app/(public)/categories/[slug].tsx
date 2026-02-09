import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { apiClient } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  children?: Category[];
}

interface Product {
  id: string;
  title: string;
  titleAr: string | null;
  slug: string;
  price: number;
  ratingAvg: number | null;
  seller?: { storeName: string };
}

export default function CategoryDetails() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        // Get categories tree
        const catRes = await apiClient.get<{ success: boolean; data: Category[] }>('/api/categories');
        const cats = Array.isArray(catRes.data) ? catRes.data : (catRes.data as any)?.data || [];
        const found = findCategory(cats, slug);
        setCategory(found);

        if (found) {
          // Fetch products in category
          const prodRes = await apiClient.get<{ success: boolean; data: Product[] }>(`/api/search?categoryId=${found.id}`);
          const prods = Array.isArray(prodRes.data) ? prodRes.data : (prodRes.data as any)?.data || [];
          setProducts(prods);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const findCategory = (cats: Category[], target: string): Category | null => {
    for (const cat of cats) {
      if (cat.slug === target) return cat;
      if (cat.children) {
        const found = findCategory(cat.children, target);
        if (found) return found;
      }
    }
    return null;
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!category) {
    return (
      <Screen>
        <Text style={{ color: colors.text, textAlign: 'center' }}>التصنيف غير متوفر.</Text>
        <Button title="العودة لكل الفئات" onPress={() => router.push('/(public)/categories')} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={{ gap: spacing.sm, paddingHorizontal: spacing.sm }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>
          {category.nameAr || category.name}
        </Text>
        <Text style={{ fontSize: typography.body, color: '#6b7280' }}>
          {products.length} منتج في هذا التصنيف
        </Text>

        {/* Subcategories */}
        {category.children && category.children.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {category.children.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                onPress={() => router.push(`/(public)/categories/${sub.slug}`)}
                style={styles.subBadge}
              >
                <Text style={styles.subBadgeText}>{sub.nameAr || sub.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {products.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
          <Text style={{ color: '#6b7280', fontSize: typography.body }}>لا توجد منتجات في هذا التصنيف</Text>
          <View style={{ marginTop: spacing.md }}>
            <Button title="تصفح جميع المنتجات" onPress={() => router.push('/(public)/products')} />
          </View>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(public)/products/${item.slug}` as const)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>
                    {item.titleAr || item.title}
                  </Text>
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
  subBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  subBadgeText: {
    color: colors.text,
    fontSize: typography.small,
  },
});
