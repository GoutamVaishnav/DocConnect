import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import type { ConsultationStatus } from '@/context/consultation-draft';

type StatusBadgeProps = {
  status: ConsultationStatus | 'New';
};

const palette = {
  'In Progress': { background: colors.patient.soft, text: colors.patient.primary },
  Pending: { background: colors.warningSoft, text: colors.warning },
  Completed: { background: colors.successSoft, text: colors.success },
  Cancelled: { background: '#FFF0F0', text: '#D93B3B' },
  New: { background: colors.doctor.soft, text: colors.doctor.primary },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusColors = palette[status];

  return (
    <View style={[styles.badge, { backgroundColor: statusColors.background }]}>
      <View style={[styles.dot, { backgroundColor: statusColors.text }]} />
      <Text style={[styles.text, { color: statusColors.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  dot: {
    borderRadius: 99,
    height: 5,
    width: 5,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
  },
});
