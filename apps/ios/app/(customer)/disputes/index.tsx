import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Dispute {
  id: string;
  subject: string;
  status: string;
}

export default function Disputes() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await apiClient.get<Dispute[]>('/api/disputes/me', { authCookie: getAuthCookie() || undefined });
        setDisputes(data || []);
      } catch {
        // API error handled silently
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Screen scroll={false}>
      {loading ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/(customer)/disputes/${item.id}`)}>
              <Card>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ color: colors.text, fontSize: typography.subheading, fontWeight: '700' }}>{item.subject}</Text>
                  <Text style={{ color: colors.text }}>الحالة: {item.status}</Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </Screen>
  );
}
