import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/context/auth';
import { formatConsultationDate, useConsultationDraft, type ConsultationRecord } from '@/context/consultation-draft';
import { consultationApi, getApiErrorMessage } from '@/lib/api';
import { openChat } from '@/lib/chat-navigation';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type TimelineItem = { detail: string; title: string };

function timelineFor(consultation: ConsultationRecord): TimelineItem[] {
  const submitted = { detail: formatConsultationDate(consultation.submittedAt), title: 'Request submitted' };

  if (consultation.status === 'Pending') {
    return [submitted, { detail: 'A doctor will review your request soon', title: 'Waiting for a doctor' }];
  }

  if (consultation.status === 'Cancelled') {
    return [submitted, { detail: 'This request is no longer active', title: 'Consultation cancelled' }];
  }

  if (consultation.status === 'Completed') {
    return [
      submitted,
      { detail: consultation.doctorName ?? 'Doctor', title: 'Doctor accepted your request' },
      { detail: consultation.completedAt ? formatConsultationDate(consultation.completedAt) : 'Doctor review finished', title: 'Consultation completed' },
    ];
  }

  return [
    submitted,
    { detail: consultation.acceptedAt ? formatConsultationDate(consultation.acceptedAt) : consultation.doctorName ?? 'Doctor', title: 'Doctor accepted your request' },
    { detail: 'You can send a message to your doctor', title: 'Consultation in progress' },
  ];
}

export default function ConsultationDetailsScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId?: string }>();
  const { session } = useAuth();
  const { getConsultation, loadConsultation } = useConsultationDraft();
  const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [screenError, setScreenError] = useState<string | null>(null);
  const consultation = typeof consultationId === 'string' ? getConsultation(consultationId) : undefined;
  const accessToken = session?.user.role === 'PATIENT' ? session.accessToken : undefined;

  useEffect(() => {
    let cancelled = false;

    async function loadDetails() {
      if (!consultationId || !accessToken) {
        if (!cancelled) setScreenError('Sign in as a patient to view this consultation.');
        return;
      }

      try {
        setIsRefreshing(true);
        setScreenError(null);
        const record = await loadConsultation(consultationId);
        const deliveryEntries = await Promise.all(record.attachments.map(async (attachment) => {
          try {
            const response = await consultationApi.getImageDeliveryUrl(accessToken, record.id, attachment.id);
            return [attachment.id, response.delivery.url] as const;
          } catch {
            return null;
          }
        }));

        if (!cancelled) {
          setAttachmentUrls(Object.fromEntries(deliveryEntries.filter((entry): entry is readonly [string, string] => entry !== null)));
        }
      } catch (error) {
        if (!cancelled) setScreenError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsRefreshing(false);
      }
    }

    void loadDetails();
    return () => { cancelled = true; };
  }, [accessToken, consultationId, loadConsultation, refreshKey]);

  function retry() {
    setRefreshKey((current) => current + 1);
  }

  if (!consultation && isRefreshing) {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><ActivityIndicator color={colors.patient.primary} size="large" /><Text style={styles.notFoundText}>Loading your consultation…</Text></SafeAreaView></View>;
  }

  if (!consultation) {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><MaterialCommunityIcons color={colors.muted} name="clipboard-text-outline" size={50} /><Text style={styles.notFoundTitle}>Consultation not found</Text><Text style={styles.notFoundText}>{screenError ?? 'This consultation is unavailable for this patient account.'}</Text><AppButton label="Back to consultations" onPress={() => router.replace('/consultations')} /></SafeAreaView></View>;
  }

  const timeline = timelineFor(consultation);
  const canChat = consultation.status === 'In Progress';
  const completed = consultation.status === 'Completed';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr('/consultations')} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable>
          <Text style={styles.topTitle}>Consultation Details</Text><View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={retry} refreshing={isRefreshing} />} showsVerticalScrollIndicator={false}>
          {screenError ? <View style={styles.errorNote}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><View style={styles.errorCopy}><Text style={styles.errorText}>{screenError}</Text><Pressable accessibilityRole="button" onPress={retry}><Text style={styles.retryText}>Try again</Text></Pressable></View></View> : null}

          <AppCard><View style={styles.summaryCard}><View style={styles.summaryIcon}><MaterialCommunityIcons color={colors.patient.primary} name="clipboard-text-outline" size={28} /></View><View style={styles.summaryCopy}><Text style={styles.summaryTitle}>{consultation.title}</Text><Text style={styles.summaryTime}>Submitted {formatConsultationDate(consultation.submittedAt)}</Text></View><StatusBadge status={consultation.status} /></View></AppCard>

          <Text style={typography.sectionTitle}>Doctor</Text>
          <AppCard>{consultation.doctorName ? <View style={styles.doctorCard}><View style={styles.doctorAvatar}><MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={29} /></View><View><Text style={styles.doctorName}>{consultation.doctorName}</Text><Text style={styles.doctorSpecialty}>{consultation.doctorSpecialty ?? 'General physician'}</Text></View></View> : <View style={styles.waitingCard}><MaterialCommunityIcons color={colors.warning} name="clock-outline" size={25} /><View style={styles.summaryCopy}><Text style={styles.doctorName}>Matching you with a doctor</Text><Text style={styles.doctorSpecialty}>You will be notified once a doctor accepts the request.</Text></View></View>}</AppCard>

          <Text style={typography.sectionTitle}>Your symptoms</Text>
          <AppCard><View style={styles.sectionCard}><Text style={styles.symptoms}>{consultation.symptoms}</Text><View style={styles.durationRow}><MaterialCommunityIcons color={colors.patient.primary} name="clock-outline" size={17} /><Text style={styles.durationText}>Duration: {consultation.duration}</Text></View></View></AppCard>

          <Text style={typography.sectionTitle}>Photos</Text>
          <AppCard><View style={styles.sectionCard}>{consultation.attachments.length > 0 ? <View style={styles.photos}>{consultation.attachments.map((attachment) => {
            const uri = attachmentUrls[attachment.id];
            return uri ? <Image accessibilityLabel={attachment.originalFileName} key={attachment.id} source={{ uri }} style={styles.photo} /> : <View key={attachment.id} style={styles.photoUnavailable}><MaterialCommunityIcons color={colors.muted} name="image-off-outline" size={24} /></View>;
          })}</View> : <View style={styles.noPhotos}><MaterialCommunityIcons color={colors.muted} name="image-outline" size={25} /><Text style={styles.noPhotosText}>No photos attached to this consultation.</Text></View>}</View></AppCard>

          <Text style={typography.sectionTitle}>Status timeline</Text>
          <AppCard><View style={styles.timelineCard}>{timeline.map((item, index) => <View key={item.title} style={styles.timelineItem}><View style={styles.timelineRail}><View style={[styles.timelineDot, index === timeline.length - 1 && styles.timelineDotActive]} />{index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}</View><View style={styles.timelineCopy}><Text style={styles.timelineTitle}>{item.title}</Text><Text style={styles.timelineDetail}>{item.detail}</Text></View></View>)}</View></AppCard>

          <AppButton disabled={!canChat && !completed} icon={completed ? 'file-document-outline' : 'message-text-outline'} label={completed ? 'View Summary' : canChat ? 'Chat with Doctor' : 'Chat available after acceptance'} onPress={() => {
            if (canChat) openChat(consultation.id, 'patient');
            if (completed) router.push({ pathname: '/consultations/[consultationId]/summary', params: { consultationId: consultation.id } });
          }} variant={canChat || completed ? 'primary' : 'outline'} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl },
  doctorAvatar: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 56, justifyContent: 'center', width: 56 },
  doctorCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  doctorName: { color: colors.navy, fontSize: 14, fontWeight: '700' }, doctorSpecialty: { color: colors.text, fontSize: 12, marginTop: 3 },
  durationRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md }, durationText: { color: colors.patient.primaryDark, fontSize: 12, fontWeight: '700' },
  errorCopy: { flex: 1, gap: spacing.xs }, errorNote: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  noPhotos: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm }, noPhotosText: { color: colors.muted, fontSize: 12 },
  notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }, notFoundText: { color: colors.text, fontSize: 13, lineHeight: 20, marginBottom: spacing.md, textAlign: 'center' }, notFoundTitle: { color: colors.navy, fontSize: 19, fontWeight: '700' },
  photo: { borderRadius: radius.sm, height: 78, width: 78 }, photoUnavailable: { alignItems: 'center', backgroundColor: colors.canvas, borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, height: 78, justifyContent: 'center', width: 78 }, photos: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  retryText: { color: colors.patient.primary, fontSize: 12, fontWeight: '700' }, safeArea: { flex: 1 }, sectionCard: { padding: spacing.md },
  summaryCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, summaryCopy: { flex: 1 }, summaryIcon: { alignItems: 'center', backgroundColor: colors.patient.soft, borderRadius: radius.md, height: 54, justifyContent: 'center', width: 54 }, summaryTime: { color: colors.muted, fontSize: 11, marginTop: 3 }, summaryTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' }, symptoms: { color: colors.text, fontSize: 13, lineHeight: 20 },
  timelineCard: { padding: spacing.md }, timelineCopy: { flex: 1, paddingBottom: spacing.lg }, timelineDetail: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: 2 }, timelineDot: { backgroundColor: colors.patient.primary, borderColor: colors.patient.softStrong, borderRadius: radius.pill, borderWidth: 3, height: 15, width: 15 }, timelineDotActive: { backgroundColor: colors.success, borderColor: colors.successSoft }, timelineItem: { flexDirection: 'row', gap: spacing.sm }, timelineLine: { backgroundColor: colors.border, flex: 1, marginBottom: -spacing.xs, marginTop: -spacing.xs, width: 2 }, timelineRail: { alignItems: 'center', width: 15 }, timelineTitle: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' }, waitingCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
});
