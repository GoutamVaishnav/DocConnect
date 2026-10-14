import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { goBackOr } from '@/lib/navigation';
import { spacing } from '@/theme/spacing';

type ConsultationHeaderProps = {
  step: 1 | 2 | 3;
  title: string;
};

const steps = ['Describe problem', 'Add photos', 'Review & submit'];

export function ConsultationHeader({ step, title }: ConsultationHeaderProps) {
  const fallback = step === 1 ? '/home' : step === 2 ? '/new-consultation' : '/consultation-photos';

  return (
    <View>
      <View style={styles.topRow}>
        <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr(fallback)} style={styles.backButton}>
          <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.backButton} />
      </View>

      <View accessibilityLabel={`Step ${step} of 3`} style={styles.stepRow}>
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const complete = stepNumber < step;
          const active = stepNumber === step;

          return (
            <View key={label} style={styles.stepItem}>
              <View style={styles.lineWrap}>
                {index > 0 ? <View style={[styles.line, complete && styles.lineComplete]} /> : <View style={styles.lineSpacer} />}
                <View style={[styles.circle, (complete || active) && styles.circleActive]}>
                  {complete ? (
                    <MaterialCommunityIcons color={colors.surface} name="check" size={14} />
                  ) : (
                    <Text style={[styles.circleText, active && styles.circleTextActive]}>{stepNumber}</Text>
                  )}
                </View>
                {index < steps.length - 1 ? <View style={[styles.line, complete && styles.lineComplete]} /> : <View style={styles.lineSpacer} />}
              </View>
              <Text numberOfLines={1} style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  circle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 29,
    justifyContent: 'center',
    width: 29,
    zIndex: 1,
  },
  circleActive: {
    backgroundColor: colors.patient.primary,
    borderColor: colors.patient.primary,
  },
  circleText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  circleTextActive: {
    color: colors.surface,
  },
  line: {
    backgroundColor: colors.border,
    flex: 1,
    height: 2,
  },
  lineComplete: {
    backgroundColor: colors.patient.primary,
  },
  lineSpacer: {
    flex: 1,
  },
  lineWrap: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepLabel: {
    color: colors.muted,
    fontSize: 9,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  stepLabelActive: {
    color: colors.patient.primary,
    fontWeight: '700',
  },
  stepRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  title: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
