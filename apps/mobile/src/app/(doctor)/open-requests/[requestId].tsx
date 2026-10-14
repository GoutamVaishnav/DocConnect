import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { formatConsultationDate } from '@/context/consultation-draft';
import { useAuth } from '@/context/auth';
import { useDoctorRequests } from '@/context/doctor-requests';
import { consultationApi, getApiErrorMessage } from '@/lib/api';
import { openChat } from '@/lib/chat-navigation';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

export default function RequestDetailsScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { session } = useAuth();
  const { acceptRequest, declineRequest, getRequest, loadRequest } = useDoctorRequests();
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const request = requestId ? getRequest(requestId) : undefined;
  const accessToken = session?.user.role === 'DOCTOR' ? session.accessToken : undefined;

  useEffect(() => {
    let cancelled = false;
    async function loadDetails() {
      if (!requestId || !accessToken) return;
      try {
        setIsLoading(true);
        setScreenError(null);
        const record = await loadRequest(requestId);
        const entries = await Promise.all(record.attachments.map(async (attachment) => {
          try {
            const response = await consultationApi.getImageDeliveryUrl(accessToken, record.id, attachment.id);
            return [attachment.id, response.delivery.url] as const;
          } catch {
            return null;
          }
        }));
        if (!cancelled) setAttachmentUrls(Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => entry !== null)));
      } catch (error) {
        if (!cancelled) setScreenError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadDetails();
    return () => { cancelled = true; };
  }, [accessToken, loadRequest, requestId]);

  async function acceptConsultation() {
    if (!request) return;
    try {
      setIsSaving(true);
      const accepted = await acceptRequest(request.id);
      router.replace({ pathname: '/request-accepted', params: { requestId: accepted.id } });
    } catch (error) {
      Alert.alert('Could not accept request', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  function declineConsultation() {
    if (!request) return;
    Alert.alert('Decline consultation?', 'This request will no longer appear in your open requests.', [
      { style: 'cancel', text: 'Cancel' },
      { style: 'destructive', text: 'Decline', onPress: () => void declineCurrentRequest() },
    ]);
  }

  async function declineCurrentRequest() {
    if (!request) return;
    try {
      setIsSaving(true);
      await declineRequest(request.id);
      router.replace('/open-requests');
    } catch (error) {
      Alert.alert('Could not decline request', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (!request && isLoading) return <View style={styles.container}><SafeAreaView style={styles.missingState}><ActivityIndicator color={colors.doctor.primary} size="large" /><Text style={styles.missingText}>Loading request…</Text></SafeAreaView></View>;
  if (!request) return <View style={styles.container}><SafeAreaView style={styles.missingState}><MaterialCommunityIcons color={colors.muted} name="file-question-outline" size={54} /><Text style={styles.missingTitle}>Request not found</Text><Text style={styles.missingText}>{screenError ?? 'This request may no longer be available to your account.'}</Text><AppButton label="Back to requests" onPress={() => router.replace('/open-requests')} role="doctor" /></SafeAreaView></View>;

  const isAccepted = request.status === 'Accepted';
  const isOpen = request.status === 'Open';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr('/open-requests')} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><Text style={styles.topTitle}>Request Details</Text><View style={styles.backButton} /></View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {screenError ? <View style={styles.errorNote}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><Text style={styles.errorText}>{screenError}</Text></View> : null}
          {request.attachments.length > 0 ? <View style={styles.previewRow}>{request.attachments.map((attachment) => { const uri = attachmentUrls[attachment.id]; return uri ? <Image accessibilityLabel={attachment.originalFileName} key={attachment.id} source={{ uri }} style={styles.previewImage} /> : <View key={attachment.id} style={styles.previewTile}><MaterialCommunityIcons color={colors.doctor.primary} name="image-outline" size={27} /></View>; })}</View> : null}
          <View style={styles.patientHeader}><View style={styles.patientAvatar}><MaterialCommunityIcons color={colors.doctor.primaryDark} name="account-outline" size={28} /></View><View style={styles.patientCopy}><Text style={typography.sectionTitle}>{request.patientLabel}</Text><Text style={styles.patientMeta}>{`${request.patientEmail} • submitted ${formatConsultationDate(request.submittedAt)}`}</Text></View><View style={[styles.statusBadge, isAccepted && styles.statusBadgeAccepted]}><Text style={[styles.statusText, isAccepted && styles.statusTextAccepted]}>{isAccepted ? 'Accepted' : request.status === 'Completed' ? 'Completed' : 'New'}</Text></View></View>
          <AppCard><View style={styles.cardContent}><Text style={styles.cardTitle}>Symptoms</Text><Text style={styles.symptoms}>{request.symptoms}</Text><View style={styles.divider} /><DetailRow label="Duration" value={request.duration} /><DetailRow label="Severity" value={request.severity} /></View></AppCard>
          <AppCard><View style={styles.cardContent}><Text style={styles.cardTitle}>Additional information</Text><Text style={styles.additionalText}>Only the consultation details and photos shared by the patient are available to the assigned doctor.</Text></View></AppCard>
          <View style={styles.secureNote}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} /><Text style={styles.secureNoteText}>Patient data is accessed through your authenticated doctor account.</Text></View>
        </ScrollView>
        <View style={styles.footer}>{isAccepted ? <AppButton icon="message-text-outline" label="Open Chat" onPress={() => openChat(request.id, 'doctor')} role="doctor" /> : isOpen ? <><AppButton disabled={isSaving} label="Decline" onPress={declineConsultation} role="doctor" variant="outline" /><AppButton icon="check-circle-outline" label="Accept Consultation" loading={isSaving} onPress={() => void acceptConsultation()} role="doctor" /></> : <AppButton label="View Case" onPress={() => router.replace({ pathname: '/cases/[caseId]', params: { caseId: request.id } })} role="doctor" />}</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  additionalText: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.xs }, backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, cardContent: { padding: spacing.md }, cardTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl }, detailLabel: { color: colors.text, fontSize: 13 }, detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm }, detailValue: { color: colors.navy, fontSize: 13, fontWeight: '700' }, divider: { backgroundColor: colors.border, height: 1, marginTop: spacing.md }, errorNote: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm, padding: spacing.md }, missingState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl }, missingText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' }, missingTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginTop: spacing.xs }, patientAvatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 }, patientCopy: { flex: 1 }, patientHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, patientMeta: { color: colors.muted, fontSize: 11, marginTop: 3 }, previewImage: { borderRadius: radius.md, height: 86, width: 86 }, previewRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }, previewTile: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderColor: colors.doctor.softStrong, borderRadius: radius.md, borderWidth: 1, height: 86, justifyContent: 'center', width: 86 }, safeArea: { flex: 1 }, secureNote: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, secureNoteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, statusBadge: { backgroundColor: colors.doctor.soft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 }, statusBadgeAccepted: { backgroundColor: colors.successSoft }, statusText: { color: colors.doctor.primaryDark, fontSize: 10, fontWeight: '700' }, statusTextAccepted: { color: colors.success }, symptoms: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.xs }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
