import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { colors, radii, shadows, spacing, typography } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(({ label, error, style, ...props }, ref) => {
  return (
    <View style={{ gap: spacing.xs }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.container, error && { borderColor: '#ef4444' }]}>
        <TextInput ref={ref} style={[styles.input, style]} placeholderTextColor="#9ca3af" {...props} />
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
    ...shadows.card,
  },
  input: {
    color: colors.text,
    fontSize: typography.body,
  },
  error: {
    color: '#ef4444',
    fontSize: typography.small,
  },
});
