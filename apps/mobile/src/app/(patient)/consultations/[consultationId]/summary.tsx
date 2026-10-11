import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { useConsultationDraft } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientConsultationSummaryScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId?: string }>();
  const { getConsultation, loadConsultation } = useConsultationDraft();
  const [isLoading, setIsLoading] = useState(() => Boolean(consultationId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const consultation = typeof consultationId === 'string' ? getConsultation(consultationId) : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!consultationId) {
      return;
    }

    void loadConsultation(consultationId)
      .catch(() => {
        if (!cancelled) setLoadError('The consultation summary could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [consultationId, loadConsultation]);

  async function openPrescription() {
    if (!consultation?.prescriptionUrl) return;
    const supported = await Linking.canOpenURL(consultation.prescriptionUrl);
    if (supported) await Linking.openURL(consultation.prescriptionUrl);
  }

  if (isLoading && !consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><ActivityIndicator color={colors.patient.primary} size="large" /><Text style={styles.notFoundText}>Loading consultation summary…</Text></SafeAreaView></View>;
  }

  if (!consultation || consultation.status !== 'Completed') {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>{loadError ?? 'A completed consultation summary is not available yet.'}</Text><AppButton label="Back to consultations" onPress={() => router.replace('/consultations')} /></SafeAreaView></View>;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Consultation Summary" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={typography.screenTitle}>{consultation.title}</Text>
          <Text style={styles.subtitle}>Completed with {consultation.doctorName ?? 'your doctor'}</Text>

          <AppCard><View style={styles.card}><Text style={styles.cardTitle}>Doctor’s Summary</Text><Text style={styles.cardText}>{consultation.doctorNotes ?? 'Your doctor did not add a written summary.'}</Text></View></AppCard>

          <AppCard><View style={styles.card}><Text style={styles.cardTitle}>Instructions</Text><View style={styles.instructionRow}><MaterialCommunityIcons color={colors.patient.primary} name="check-circle-outline" size={18} /><Text style={styles.cardText}>{consultation.careInstructions ?? 'No additional care instructions were provided.'}</Text></View></View></AppCard>

          <AppCard><View style={styles.card}><View style={styles.prescriptionTitle}><MaterialCommunityIcons color={colors.patient.primary} name="file-document-outline" size={22} /><Text style={styles.cardTitle}>Prescription</Text></View>{consultation.prescriptionUrl ? <Pressable accessibilityRole="link" onPress={() => void openPrescription()} style={styles.prescriptionLink}><Text style={styles.prescriptionLinkText}>Open prescription document</Text><MaterialCommunityIcons color={colors.patient.primary} name="open-in-new" size={17} /></Pressable> : <Text style={styles.cardText}>No prescription document was added.</Text>}</View></AppCard>

          <View style={styles.note}><MaterialCommunityIcons color={colors.patient.primary} name="shield-check-outline" size={20} /><Text style={styles.noteText}>This summary is visible only to the patient and care team assigned to this consultation.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.xs, padding: spacing.md }, cardText: { color: colors.text, flex: 1, fontSize: 13, lineHeight: 20 }, cardTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, instructionRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs }, note: { alignItems: 'flex-start', backgroundColor: colors.patient.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }, notFoundText: { color: colors.text, fontSize: 14, textAlign: 'center' }, prescriptionLink: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs }, prescriptionLinkText: { color: colors.patient.primary, fontSize: 13, fontWeight: '700' }, prescriptionTitle: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs }, safeArea: { flex: 1 }, subtitle: { color: colors.text, fontSize: 14, marginTop: -spacing.sm },
});
