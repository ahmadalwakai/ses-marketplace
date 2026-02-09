import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii, shadows, spacing } from '../../theme/tokens';

interface CardProps {
  children: ReactNode;
  padded?: boolean;
}

export const Card = ({ children, padded = true }: CardProps) => {
  return <View style={[styles.card, padded && { padding: spacing.md }]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.background,
    ...shadows.neon,
  },
});
