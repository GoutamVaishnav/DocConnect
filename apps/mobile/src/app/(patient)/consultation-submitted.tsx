import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function ConsultationSubmittedScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId?: string }>();

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            <View style={styles.clipboard}>
              <MaterialCommunityIcons color={colors.patient.primary} name="clipboard-text-outline" size={68} />
            </View>
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons color={colors.surface} name="check" size={28} />
            </View>
          </View>

          <Text style={styles.title}>Request Submitted!</Text>
          <Text style={styles.description}>Your consultation request is ready for doctor review.</Text>

          <View style={styles.note}>
            <MaterialCommunityIcons color={colors.patient.primary} name="shield-check-outline" size={21} />
            <Text style={styles.noteText}>Your request has been securely sent and is waiting for a doctor to accept it.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {consultationId ? (
            <AppButton
              label="View Consultation"
              onPress={() => router.replace({ pathname: '/consultations/[consultationId]', params: { consultationId } })}
              variant="outline"
            />
          ) : null}
          <AppButton label="Go to Home" onPress={() => router.replace('/home')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkCircle: {
    alignItems: 'center',
    backgroundColor: colors.success,
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 4,
    bottom: 6,
    height: 50,
    justifyContent: 'center',
    position: 'absolute',
    right: 2,
    width: 50,
  },
  clipboard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    height: 140,
    justifyContent: 'center',
    width: 140,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 280,
    textAlign: 'center',
  },
  footer: {
    gap: spacing.sm,
    padding: spacing.xl,
    paddingTop: spacing.sm,
  },
  illustration: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.pill,
    height: 188,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    width: 188,
  },
  note: {
    alignItems: 'flex-start',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xxl,
    padding: spacing.md,
  },
  noteText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  safeArea: {
    flex: 1,
  },
  title: {
    color: colors.navy,
    fontSize: 25,
    fontWeight: '700',
  },
});
