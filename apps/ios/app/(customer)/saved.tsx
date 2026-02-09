import { FlatList, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useWishlistStore } from '../../src/lib/store/wishlist';
import { colors, spacing, typography, radii } from '../../src/theme/tokens';

export default function SavedScreen() {
  const router = useRouter();
  const items = useWishlistStore((state) => state.items);
  const removeItem = useWishlistStore((state) => state.remove);
  const clearAll = useWishlistStore((state) => state.clear);

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Text style={styles.title}>🔖 المحفوظات</Text>
        <Text style={styles.subtitle}>
          {items.length === 0 ? 'لا توجد عناصر محفوظة' : `${items.length} عنصر محفوظ`}
        </Text>
      </View>

      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🔖</Text>
          <Text style={styles.emptyText}>لم تحفظ أي عناصر بعد</Text>
          <Text style={styles.emptyHint}>
            اضغط على زر الحفظ في أي منتج لإضافته هنا
          </Text>
          <Button
            title="تصفح المنتجات"
            onPress={() => router.push('/(public)/products')}
          />
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: spacing.sm }}>
            <Button title="مسح الكل" onPress={() => clearAll()} variant="ghost" />
          </View>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
            renderItem={({ item }) => (
              <Card>
                <View style={styles.itemRow}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    onPress={() => router.push(`/(public)/products/${item.id}` as const)}
                  >
                    <View style={{ gap: spacing.xs }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.price != null && (
                        <Text style={styles.itemPrice}>{item.price.toLocaleString()} ل.س</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            )}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.body,
    color: '#6b7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  emptyEmoji: {
    fontSize: 64,
  },
  emptyText: {
    fontSize: typography.subheading,
    fontWeight: '700',
    color: colors.text,
  },
  emptyHint: {
    fontSize: typography.body,
    color: '#6b7280',
    textAlign: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemName: {
    fontSize: typography.subheading,
    fontWeight: '700',
    color: colors.text,
  },
  itemPrice: {
    fontSize: typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#ef4444',
    fontWeight: '700',
    fontSize: 16,
  },
});
