import { Text, View } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { useWishlistStore } from '../../src/lib/store/wishlist';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function Compare() {
  const items = useWishlistStore((state) => state.items);

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>
        العناصر للمقارنة (اختر من المفضلة)
      </Text>
      <View style={{ gap: spacing.sm }}>
        {items.length === 0 && <Text style={{ color: colors.text }}>أضف عناصر للمقارنة من قائمة المفضلة.</Text>}
        {items.map((item) => (
          <Card key={item.id}>
            <View style={{ gap: spacing.xs }}>
              <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>{item.name}</Text>
              {item.price != null && <Text style={{ color: colors.text }}>السعر: {item.price} ر.س</Text>}
              <Text style={{ color: colors.text }}>جاهز للمقارنة.</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
}
