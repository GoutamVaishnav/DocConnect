import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, type PressableStateCallbackType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type RoleOptionProps = {
  description: string;
  icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  onPress: () => void;
  role: 'patient' | 'doctor';
};

function RoleOption({ description, icon, label, onPress, role }: RoleOptionProps) {
  const isPatient = role === 'patient';
  const theme = isPatient ? colors.patient : colors.doctor;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.option,
        { backgroundColor: theme.soft, borderColor: theme.primary },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.primary }]}>
        <MaterialCommunityIcons color={colors.surface} name={icon} size={27} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.optionLabel}>Continue as</Text>
        <Text style={[styles.optionRole, { color: theme.primary }]}>{label}</Text>
        <Text style={styles.optionDescription}>{description}</Text>
      </View>
      <MaterialCommunityIcons color={theme.primary} name="chevron-right" size={25} />
    </Pressable>
  );
}

export default function ChooseRoleScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.heading}>
          <Text style={styles.title}>Welcome to DocConnect</Text>
          <Text style={styles.subtitle}>Choose your role to continue</Text>
        </View>

        <View style={styles.options}>
          <RoleOption
            description="Get advice from verified doctors"
            icon="account-heart-outline"
            label="Patient"
            onPress={() => router.push('/patient-login')}
            role="patient"
          />
          <RoleOption
            description="Help patients with your expertise"
            icon="stethoscope"
            label="Doctor"
            onPress={() => router.push('/doctor-login')}
            role="doctor"
          />
        </View>

        <Text style={styles.footer}>Choose a role to sign in or create a patient account.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  copy: {
    flex: 1,
  },
  footer: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  heading: {
    alignItems: 'center',
    marginTop: spacing.xxxl * 1.4,
  },
  iconCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  option: {
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 125,
    padding: spacing.lg,
  },
  optionDescription: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 5,
  },
  optionLabel: {
    color: colors.text,
    fontSize: 13,
  },
  optionRole: {
    fontSize: 21,
    fontWeight: '700',
    marginTop: 1,
  },
  options: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    marginTop: -spacing.xxxl,
  },
  pressed: {
    opacity: 0.78,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  subtitle: {
    color: colors.text,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  title: {
    color: colors.navy,
    fontSize: 25,
    fontWeight: '700',
    textAlign: 'center',
  },
});
