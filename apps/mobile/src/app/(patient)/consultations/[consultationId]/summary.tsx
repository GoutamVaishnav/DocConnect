import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const { getConsultation } = useConsultationDraft();
  const consultation = typeof consultationId === 'string' ? getConsultation(consultationId) : undefined;

  if (!consultation || consultation.status !== 'Completed') {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>A completed consultation summary is not available yet.</Text><AppButton label="Back to consultations" onPress={() => router.replace('/consultations')} /></SafeAreaView></View>;
  }

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Consultation Summary" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>{consultation.title}</Text><Text style={styles.subtitle}>Completed with {consultation.doctorName ?? 'your doctor'}</Text><AppCard><View style={styles.card}><Text style={styles.cardTitle}>Doctor’s Summary</Text><Text style={styles.cardText}>The final consultation summary will appear here when it is securely provided by the doctor.</Text></View></AppCard><AppCard><View style={styles.card}><Text style={styles.cardTitle}>Instructions</Text><View style={styles.placeholderRow}><MaterialCommunityIcons color={colors.patient.primary} name="check-circle-outline" size={18} /><Text style={styles.cardText}>Care instructions will be available after backend integration.</Text></View></View></AppCard><AppCard><View style={styles.card}><View style={styles.prescriptionTitle}><MaterialCommunityIcons color={colors.patient.primary} name="file-document-outline" size={22} /><Text style={styles.cardTitle}>Prescription</Text></View><Text style={styles.cardText}>No prescription document is available in this local UI demo.</Text></View></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>This screen is a frontend placeholder. Medical documents require an authenticated backend and patient consent.</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ card: { gap: spacing.xs, padding: spacing.md }, cardText: { color: colors.text, fontSize: 13, lineHeight: 20 }, cardTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }, notFoundText: { color: colors.text, fontSize: 14, textAlign: 'center' }, placeholderRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs }, prescriptionTitle: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs }, safeArea: { flex: 1 }, subtitle: { color: colors.text, fontSize: 14, marginTop: -spacing.sm }, });
