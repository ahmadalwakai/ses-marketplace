import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { Button } from '../../../src/components/ui/Button';
import { apiClient } from '../../../src/lib/api/client';
import { useCartStore } from '../../../src/lib/store/cart';
import { useWishlistStore } from '../../../src/lib/store/wishlist';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Product {
  id: string;
  title: string;
  titleAr?: string;
  name: string;
  description?: string;
  descriptionAr?: string;
  price?: number;
  slug: string;
  condition?: string;
  ratingAvg?: number;
  seller?: { storeName: string };
}

export default function ProductDetails() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const addToCart = useCartStore((state) => state.addItem);
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const wishlistItems = useWishlistStore((state) => state.items);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        const { data } = await apiClient.get<Product>(`/api/products/${slug}`);
        setProduct(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  const isInWishlist = product ? wishlistItems.some((i) => i.id === product.id) : false;

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!product) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>لم يتم العثور على المنتج.</Text>
      </Screen>
    );
  }

  const displayName = product.titleAr || product.title || product.name;

  return (
    <Screen>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>{displayName}</Text>
          {(product.descriptionAr || product.description) && (
            <Text style={{ fontSize: typography.body, color: colors.text }}>
              {product.descriptionAr || product.description}
            </Text>
          )}
          {product.condition && (
            <Text style={{ fontSize: typography.small, color: '#6b7280' }}>
              الحالة: {product.condition === 'NEW' ? 'جديد' : product.condition === 'LIKE_NEW' ? 'كالجديد' : product.condition === 'GOOD' ? 'جيد' : product.condition}
            </Text>
          )}
          {product.seller && (
            <Text style={{ fontSize: typography.small, color: '#6b7280' }}>
              البائع: {product.seller.storeName}
            </Text>
          )}
          {product.price != null && (
            <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>
              السعر: {product.price.toLocaleString()} ل.س
            </Text>
          )}
          {product.ratingAvg != null && (
            <Text style={{ fontSize: typography.body, color: '#eab308' }}>
              ★ {Number(product.ratingAvg).toFixed(1)}
            </Text>
          )}
          <View style={{ gap: spacing.sm }}>
            <Button
              title="أضف إلى السلة"
              onPress={() => addToCart({ id: product.id, name: displayName, price: product.price || 0 }, 1)}
            />
            <Button
              title={isInWishlist ? '🔖 تمت الإضافة للمحفوظات' : '🔖 حفظ'}
              onPress={() => toggleWishlist({ id: product.id, name: displayName, price: product.price })}
              variant={isInWishlist ? 'ghost' : 'outline'}
            />
          </View>
        </View>
      </Card>
    </Screen>
  );
}
