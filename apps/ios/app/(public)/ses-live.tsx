import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useRouter } from 'expo-router';
import { colors, spacing, typography } from '../../src/theme/tokens';

export default function SESLive() {
  const router = useRouter();

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.liveIcon}>🔴</Text>
        <Text style={styles.title}>SES Live</Text>
      </View>

      <Card>
        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Text style={styles.emoji}>📺</Text>
          <Text style={styles.subtitle}>البث المباشر قادم قريباً!</Text>
          <Text style={styles.description}>
            سيتمكن البائعون من عرض منتجاتهم عبر بث مباشر مع إمكانية التفاعل والشراء
            المباشر. تابعنا لتكون أول من يعرف!
          </Text>
        </View>
      </Card>

      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={styles.featureTitle}>✨ مميزات قادمة</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>• بث مباشر من البائعين</Text>
            <Text style={styles.featureItem}>• تفاعل مع البائع في الوقت الحقيقي</Text>
            <Text style={styles.featureItem}>• شراء مباشر أثناء البث</Text>
            <Text style={styles.featureItem}>• عروض حصرية للمشاهدين</Text>
            <Text style={styles.featureItem}>• إشعارات عند بدء البث</Text>
          </View>
        </View>
      </Card>

      <View style={{ gap: spacing.sm }}>
        <Button
          title="تصفح المنتجات بدلاً من ذلك"
          onPress={() => router.push('/(public)/products')}
        />
        <Button
          title="العودة للرئيسية"
          onPress={() => router.push('/(public)/')}
          variant="outline"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  liveIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: typography.heading + 4,
    fontWeight: '700',
    color: '#ef4444',
  },
  emoji: {
    fontSize: 64,
  },
  subtitle: {
    fontSize: typography.heading,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: typography.body,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  featureTitle: {
    fontSize: typography.subheading,
    fontWeight: '700',
    color: colors.text,
  },
  featureList: {
    gap: spacing.xs,
  },
  featureItem: {
    fontSize: typography.body,
    color: colors.text,
    lineHeight: 22,
  },
});
