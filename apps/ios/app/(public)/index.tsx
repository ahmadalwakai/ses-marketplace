import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Screen } from '../../src/components/layout/Screen';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';
import { colors, spacing, typography, radii } from '../../src/theme/tokens';
import CookieConsentModal from '../../src/components/CookieConsentModal';
import { hasDecided } from '../../src/lib/store/consent';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    hasDecided().then((decided) => {
      if (!decided) setShowConsent(true);
    });
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/(public)/products?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/(public)/products');
    }
  };

  return (
    <Screen>
      <View style={{ gap: spacing.md }}>
        <Text style={{ fontSize: typography.heading + 4, fontWeight: '700', color: colors.text }}>
          أهلاً بك في سوق SES
        </Text>
        <Text style={{ fontSize: typography.body, color: colors.text }}>
          تصفح أفضل المنتجات، المتاجر، وعروض البائعين بواجهة بسيطة وهوية مضيئة.
        </Text>
      </View>

      {/* Search Bar - ابحث عن أي شيء */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>
            🔍 ابحث عن أي شيء
          </Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن أي شيء..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              textAlign="right"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>بحث</Text>
            </TouchableOpacity>
          </View>
          <Button
            title="بحث متقدم"
            onPress={() => router.push('/(public)/products?advanced=true')}
            variant="outline"
          />
        </View>
      </Card>

      {/* Shop by Category - تسوق حسب الفئة */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>
            📂 تسوق حسب الفئة
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button title="كل الفئات" onPress={() => router.push('/(public)/categories')} />
            <Button title="المنتجات" onPress={() => router.push('/(public)/products')} variant="outline" />
          </View>
        </View>
      </Card>

      {/* SES Live */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: '#ef4444' }}>
            🔴 SES Live
          </Text>
          <Text style={{ fontSize: typography.body, color: colors.text }}>
            عروض بث مباشر من أفضل البائعين
          </Text>
          <Button title="شاهد البث المباشر" onPress={() => router.push('/(public)/ses-live')} />
        </View>
      </Card>

      {/* Small Business */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: '#16a34a' }}>
            🏪 أعمال صغيرة
          </Text>
          <Text style={{ fontSize: typography.body, color: colors.text }}>
            ادعم الأعمال الصغيرة والبائعين الموثقين في سوريا
          </Text>
          <Button title="تصفح الأعمال الصغيرة" onPress={() => router.push('/(public)/small-business')} />
        </View>
      </Card>

      {/* Saved & Wishlist */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>
            🔖 المحفوظات والمفضلة
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button title="المحفوظات" onPress={() => router.push('/(customer)/saved')} variant="outline" />
            <Button title="المفضلة" onPress={() => router.push('/(customer)/wishlist')} variant="ghost" />
          </View>
        </View>
      </Card>

      {/* Quick Browse */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>تصفح سريع</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            <Button title="المتاجر" onPress={() => router.push('/(public)/stores/demo-store')} variant="ghost" />
          </View>
        </View>
      </Card>

      {/* Account */}
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Text style={{ fontSize: typography.subheading, fontWeight: '700', color: colors.text }}>هل لديك حساب؟</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title="تسجيل الدخول" onPress={() => router.push('/(auth)/login')} />
            <Button title="مستخدم جديد" onPress={() => router.push('/(auth)/register')} variant="outline" />
          </View>
        </View>
      </Card>

      <CookieConsentModal
        visible={showConsent}
        onDone={() => setShowConsent(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  searchButton: {
    backgroundColor: colors.text,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: colors.background,
    fontSize: typography.body,
    fontWeight: '600',
  },
});
