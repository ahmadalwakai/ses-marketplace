import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Store {
  id: string;
  name: string;
  description?: string;
  owner?: string;
}

export default function StorePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      try {
        const { data } = await apiClient.get<Store>(`/api/stores/${slug}`);
        setStore(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!store) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>المتجر غير متاح.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>{store.name}</Text>
          {store.description && <Text style={{ fontSize: typography.body, color: colors.text }}>{store.description}</Text>}
          {store.owner && <Text style={{ fontSize: typography.body, color: colors.text }}>المالك: {store.owner}</Text>}
        </View>
      </Card>
    </Screen>
  );
}
