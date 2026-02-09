import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'ghost' | 'outline';
  loading?: boolean;
}

export const Button = ({ title, onPress, icon, variant = 'primary', loading }: ButtonProps) => {
  const isGhost = variant === 'ghost';
  const isOutline = variant === 'outline';
  const bg = isGhost ? 'transparent' : isOutline ? colors.background : colors.text;
  const color = isGhost ? colors.text : isOutline ? colors.text : colors.background;

  return (
    <Pressable onPress={onPress} style={[styles.base, { backgroundColor: bg, borderColor: colors.border }]}
      android_ripple={{ color: '#d1d5db' }}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.card,
  },
  label: {
    fontSize: typography.subheading,
    fontWeight: '600',
  },
});
