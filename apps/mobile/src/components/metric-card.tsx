import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/app-card';
import { colors, type AppRole, roleColors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type MetricCardProps = {
  label: string;
  value: string;
  role: AppRole;
};

export function MetricCard({ label, value, role }: MetricCardProps) {
  const theme = roleColors(role);

  return (
    <View style={styles.wrapper}>
      <AppCard>
        <View style={styles.card}>
          <Text style={[styles.value, { color: theme.primary }]}>{value}</Text>
          <Text style={styles.label}>{label}</Text>
        </View>
      </AppCard>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 79,
    padding: spacing.sm,
  },
  label: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 4,
  },
  value: {
    fontSize: 23,
    fontWeight: '700',
  },
  wrapper: {
    flex: 1,
  },
});
