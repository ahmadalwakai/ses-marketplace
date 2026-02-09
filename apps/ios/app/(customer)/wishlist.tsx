import { Text, TouchableOpacity, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { useWishlistStore } from '../../src/lib/store/wishlist';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function Wishlist() {
  const items = useWishlistStore((state) => state.items);
  const remove = useWishlistStore((state) => state.remove);

  return (
    <Screen>
      {items.length === 0 ? (
        <Text style={{ color: colors.text }}>قائمة المفضلة فارغة حالياً.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          {items.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => remove(item.id)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>{item.name}</Text>
                  {item.price != null && <Text style={{ color: colors.text }}>السعر: {item.price} ر.س</Text>}
                  <Text style={{ color: colors.text }}>اضغط للإزالة</Text>
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </Screen>
  );
}
