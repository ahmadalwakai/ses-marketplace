import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../../src/components/layout/Screen';
import { Card } from '../../../src/components/ui/Card';
import { apiClient } from '../../../src/lib/api/client';
import { getAuthCookie } from '../../../src/lib/store/auth';
import { colors, spacing, typography } from '../../../src/theme/tokens';

interface Dispute {
  id: string;
  subject: string;
  status: string;
  message?: string;
}

export default function DisputeDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await apiClient.get<Dispute>(`/api/disputes/${id}`, { authCookie: getAuthCookie() || undefined });
        setDispute(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator color={colors.text} />
      </Screen>
    );
  }

  if (!dispute) {
    return (
      <Screen>
        <Text style={{ color: colors.text }}>لا توجد تفاصيل للشكوى.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <Card>
        <View style={{ gap: spacing.xs }}>
          <Text style={{ fontSize: typography.heading, fontWeight: '700', color: colors.text }}>{dispute.subject}</Text>
          <Text style={{ color: colors.text }}>الحالة: {dispute.status}</Text>
          {dispute.message && <Text style={{ color: colors.text }}>{dispute.message}</Text>}
        </View>
      </Card>
    </Screen>
  );
}
