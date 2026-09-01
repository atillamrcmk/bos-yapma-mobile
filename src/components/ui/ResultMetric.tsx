import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface ResultMetricProps {
  value: string;
  label: string;
  highlight?: boolean;
}

export function ResultMetric({ value, label, highlight = false }: ResultMetricProps) {
  return (
    <View style={styles.container}>
      <Text
        style={[styles.value, highlight && styles.valueLarge, highlight && styles.valueHighlight]}
      >
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  value: {
    ...typography.metricSmall,
    fontSize: 32,
  },
  valueLarge: {
    fontSize: 56,
  },
  valueHighlight: {
    color: colors.accentPrimary,
  },
  label: {
    ...typography.label,
    fontSize: 11,
  },
});
