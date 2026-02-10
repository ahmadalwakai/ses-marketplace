import { Badge, HStack, Text } from '@chakra-ui/react';

type VerificationLevel = 'BASIC' | 'VERIFIED' | 'PREMIUM' | 'TOP_RATED' | string;

type Props = {
  level?: VerificationLevel | null;
  status?: string | null;
};

const levelLabels: Record<string, { label: string; color: string }> = {
  BASIC: { label: 'بائع أساسي', color: 'gray' },
  VERIFIED: { label: 'موثّق', color: 'green' },
  PREMIUM: { label: 'مميز', color: 'blue' },
  TOP_RATED: { label: 'الأعلى تقييماً', color: 'orange' },
};

export default function SellerBadge({ level, status }: Props) {
  const safeLevel = level || 'BASIC';
  const config = levelLabels[safeLevel] || levelLabels.BASIC;
  const isApproved = status === 'APPROVED';

  return (
    <HStack gap={2}>
      <Badge colorScheme={config.color} variant="subtle">
        {config.label}
      </Badge>
      {isApproved && (
        <Text fontSize="sm" color="green.600">
          موثّق
        </Text>
      )}
    </HStack>
  );
}
