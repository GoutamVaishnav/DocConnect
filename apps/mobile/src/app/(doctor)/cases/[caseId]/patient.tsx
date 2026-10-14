import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { getApiErrorMessage } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function InformationCard({ icon, label, value }: { icon: 'account-outline' | 'email-outline' | 'clipboard-text-outline' | 'alert-circle-outline'; label: string; value: string }) {
  return <AppCard><View style={styles.infoCard}><View style={styles.iconBox}><MaterialCommunityIcons color={colors.doctor.primary} name={icon} size={21} /></View><View style={styles.copy}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View></View></AppCard>;
}

export default function PatientInformationScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { getRequest, loadRequest } = useDoctorRequests();
  const [isLoading, setIsLoading] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;

  useEffect(() => {
    let cancelled = false;
    if (!caseId) return;
    void (async () => {
      try {
        setIsLoading(true);
        await loadRequest(caseId);
      } catch (error) {
        if (!cancelled) setScreenError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, loadRequest]);

  if (!caseItem && isLoading) return <View style={styles.container}><SafeAreaView style={styles.notFound}><ActivityIndicator color={colors.doctor.primary} size="large" /><Text style={styles.notFoundText}>Loading patient information…</Text></SafeAreaView></View>;
  if (!caseItem || caseItem.status === 'Open') return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>{screenError ?? 'Patient information is unavailable.'}</Text><AppButton label="Back to cases" onPress={() => router.replace('/my-cases')} role="doctor" /></SafeAreaView></View>;

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><View style={styles.topBar}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr({ pathname: '/cases/[caseId]', params: { caseId: caseItem.id } })} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><Text style={styles.topTitle}>Patient Information</Text><View style={styles.backButton} /></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primary} name="account-outline" size={38} /></View><Text style={typography.sectionTitle}>{caseItem.patientLabel}</Text><Text style={styles.profileMeta}>Information shared for this consultation</Text></View><InformationCard icon="account-outline" label="Patient name" value={caseItem.patientLabel} /><InformationCard icon="email-outline" label="Contact" value={caseItem.patientEmail} /><InformationCard icon="clipboard-text-outline" label="Medical History" value="No medical-history record was shared with this consultation." /><InformationCard icon="alert-circle-outline" label="Allergies" value="No allergy information was shared with this consultation." /><View style={styles.note}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} /><Text style={styles.noteText}>Only profile information included in the authenticated consultation response is shown here.</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 82, justifyContent: 'center', width: 82 }, backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl }, copy: { flex: 1 }, iconBox: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }, infoCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, label: { color: colors.navy, fontSize: 14, fontWeight: '700' }, note: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }, notFoundText: { color: colors.text, fontSize: 14, textAlign: 'center' }, profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }, profileMeta: { color: colors.muted, fontSize: 12 }, safeArea: { flex: 1 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' }, value: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
