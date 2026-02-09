import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { colors, spacing, typography, radii } from '../../../src/theme/tokens';

interface Category {
  id: string;
  name: string;
  nameAr: string | null;
  slug: string;
  children?: Category[];
}

export default function Categories() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get<{ success: boolean; data: Category[] }>('/api/categories');
        if (Array.isArray(data)) {
          setCategories(data);
        } else if (data && Array.isArray((data as any).data)) {
          setCategories((data as any).data);
        }
      } catch {
        // API error handled silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedIds.includes(item.id);

    return (
      <Card>
        <View style={{ gap: spacing.xs }}>
          <TouchableOpacity
            onPress={() => router.push(`/(public)/categories/${item.slug}`)}
            style={styles.categoryRow}
          >
            <Text style={styles.categoryIcon}>📦</Text>
            <Text style={styles.categoryName}>{item.nameAr || item.name}</Text>
          </TouchableOpacity>

          {hasChildren && (
            <TouchableOpacity
              onPress={() => toggleExpanded(item.id)}
              style={styles.expandButton}
            >
              <Text style={styles.expandText}>
                {isExpanded ? '▲ إخفاء' : `▼ ${item.children!.length} تصنيف فرعي`}
              </Text>
            </TouchableOpacity>
          )}

          {isExpanded && item.children && (
            <View style={styles.childrenContainer}>
              {item.children.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => router.push(`/(public)/categories/${sub.slug}`)}
                  style={styles.subCategory}
                >
                  <Text style={styles.subCategoryText}>{sub.nameAr || sub.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
          كل الفئات
        </Text>
        <Text style={{ fontSize: typography.body, color: '#6b7280', textAlign: 'center', marginTop: spacing.xs }}>
          تسوق حسب الفئة
        </Text>
      </View>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
          renderItem={renderCategory}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    fontSize: 24,
  },
  categoryName: {
    color: colors.text,
    fontSize: typography.subheading,
    fontWeight: '700',
    flex: 1,
  },
  expandButton: {
    paddingVertical: spacing.xs,
  },
  expandText: {
    color: '#6b7280',
    fontSize: typography.small,
    textAlign: 'center',
  },
  childrenContainer: {
    borderRightWidth: 2,
    borderRightColor: '#e5e7eb',
    paddingRight: spacing.sm,
    gap: spacing.xs,
  },
  subCategory: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  subCategoryText: {
    color: '#374151',
    fontSize: typography.body,
  },
});
