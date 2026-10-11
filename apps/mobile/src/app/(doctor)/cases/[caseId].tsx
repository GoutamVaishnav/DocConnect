import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { formatConsultationDate } from '@/context/consultation-draft';
import { useDoctorRequests } from '@/context/doctor-requests';
import { getApiErrorMessage } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function CaseDetailsScreen() {
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
        setScreenError(null);
        await loadRequest(caseId);
      } catch (error) {
        if (!cancelled) setScreenError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, loadRequest]);

  if (!caseItem && isLoading) return <View style={styles.container}><SafeAreaView style={styles.emptyState}><ActivityIndicator color={colors.doctor.primary} size="large" /><Text style={styles.emptyText}>Loading consultation…</Text></SafeAreaView></View>;
  if (!caseItem || caseItem.status === 'Open') return <View style={styles.container}><SafeAreaView style={styles.emptyState}><MaterialCommunityIcons color={colors.muted} name="briefcase-remove-outline" size={52} /><Text style={styles.emptyTitle}>Case unavailable</Text><Text style={styles.emptyText}>{screenError ?? 'Accept the request before opening its case workspace.'}</Text><AppButton label="Open Requests" onPress={() => router.replace('/open-requests')} role="doctor" /></SafeAreaView></View>;

  const completed = caseItem.status === 'Completed';
  const canChat = caseItem.status === 'Accepted';

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><View style={styles.topBar}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><Text style={styles.topTitle}>Consultation Details</Text><View style={styles.backButton} /></View><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>{screenError ? <View style={styles.errorNote}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><Text style={styles.errorText}>{screenError}</Text></View> : null}<AppCard><View style={styles.patientCard}><View style={styles.patientIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="account-outline" size={29} /></View><View style={styles.patientCopy}><Text style={styles.patientName}>{caseItem.patientLabel}</Text><Text style={styles.patientMeta}>{`${caseItem.concern} • ${caseItem.patientEmail}`}</Text></View><View style={[styles.statusBadge, completed && styles.statusBadgeComplete]}><Text style={[styles.statusText, completed && styles.statusTextComplete]}>{completed ? 'Completed' : 'In progress'}</Text></View></View></AppCard><AppCard><Pressable accessibilityLabel="View patient information" onPress={() => router.push({ pathname: '/cases/[caseId]/patient', params: { caseId: caseItem.id } })} style={styles.row}><View style={styles.rowIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="account-card-outline" size={22} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Patient Information</Text><Text style={styles.rowDetail}>Profile information shared for this consultation</Text></View><MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} /></Pressable></AppCard><Text style={typography.sectionTitle}>Consultation request</Text><AppCard><View style={styles.sectionCard}><Text style={styles.symptoms}>{caseItem.symptoms}</Text><View style={styles.infoRow}><Text style={styles.infoLabel}>Duration</Text><Text style={styles.infoValue}>{caseItem.duration}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Severity</Text><Text style={styles.infoValue}>{caseItem.severity}</Text></View><View style={styles.infoRow}><Text style={styles.infoLabel}>Submitted</Text><Text style={styles.infoValue}>{formatConsultationDate(caseItem.submittedAt)}</Text></View></View></AppCard><Text style={typography.sectionTitle}>Consultation Summary</Text><AppCard><Pressable accessibilityLabel="Prepare consultation summary" onPress={() => router.push({ pathname: '/cases/[caseId]/summary', params: { caseId: caseItem.id } })} style={styles.row}><View style={styles.rowIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="clipboard-text-outline" size={22} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{completed ? 'View completed summary' : 'Prepare Summary'}</Text><Text style={styles.rowDetail}>{completed ? 'Notes and care instructions are saved.' : 'Add notes and care instructions to complete this case.'}</Text></View><MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} /></Pressable></AppCard><View style={styles.secureNote}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} /><Text style={styles.secureText}>Clinical notes are stored against this consultation and become visible to the patient only after completion.</Text></View></ScrollView><View style={styles.footer}>{completed ? <AppButton label="View Summary" onPress={() => router.push({ pathname: '/cases/[caseId]/summary', params: { caseId: caseItem.id } })} role="doctor" /> : <AppButton disabled={!canChat} label={canChat ? 'Open Chat' : 'Chat unavailable'} icon="message-text-outline" onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: caseItem.id, role: 'doctor' } })} role="doctor" />}</View></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl }, emptyState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl }, emptyText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' }, emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '700' }, errorNote: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.md }, infoLabel: { color: colors.text, fontSize: 13 }, infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm }, infoValue: { color: colors.navy, fontSize: 13, fontWeight: '700' }, patientCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, patientCopy: { flex: 1 }, patientIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 54, justifyContent: 'center', width: 54 }, patientMeta: { color: colors.text, fontSize: 12, marginTop: 3 }, patientName: { color: colors.navy, fontSize: 16, fontWeight: '700' }, row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, rowCopy: { flex: 1 }, rowDetail: { color: colors.muted, fontSize: 11, marginTop: 3 }, rowIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }, rowTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' }, safeArea: { flex: 1 }, sectionCard: { padding: spacing.md }, secureNote: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, secureText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, statusBadge: { backgroundColor: colors.doctor.soft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 }, statusBadgeComplete: { backgroundColor: colors.successSoft }, statusText: { color: colors.doctor.primaryDark, fontSize: 10, fontWeight: '700' }, statusTextComplete: { color: colors.success }, symptoms: { color: colors.text, fontSize: 13, lineHeight: 20 }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
