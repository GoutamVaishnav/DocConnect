import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { StatusBadge } from '@/components/status-badge';
import { useConsultationDraft, type ConsultationRecord } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type TimelineItem = {
  detail: string;
  title: string;
};

function timelineFor(consultation: ConsultationRecord): TimelineItem[] {
  const submitted = { detail: consultation.submittedAt, title: 'Request submitted' };

  if (consultation.status === 'Pending') {
    return [submitted, { detail: 'A doctor will review your request soon', title: 'Waiting for a doctor' }];
  }

  if (consultation.status === 'Completed') {
    return [submitted, { detail: consultation.doctorName ?? 'Doctor', title: 'Consultation completed' }];
  }

  return [submitted, { detail: consultation.doctorName ?? 'Doctor', title: 'Doctor accepted your request' }, { detail: 'You can send a message to your doctor', title: 'Consultation in progress' }];
}

export default function ConsultationDetailsScreen() {
  const { consultationId } = useLocalSearchParams<{ consultationId?: string }>();
  const { getConsultation } = useConsultationDraft();
  const consultation = typeof consultationId === 'string' ? getConsultation(consultationId) : undefined;

  if (!consultation) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.notFound}>
          <MaterialCommunityIcons color={colors.muted} name="clipboard-text-outline" size={50} />
          <Text style={styles.notFoundTitle}>Consultation not found</Text>
          <Text style={styles.notFoundText}>This local demo request may have been cleared after the app restarted.</Text>
          <AppButton label="Back to consultations" onPress={() => router.replace('/consultations')} />
        </SafeAreaView>
      </View>
    );
  }

  const timeline = timelineFor(consultation);
  const canChat = consultation.status === 'In Progress';
  const completed = consultation.status === 'Completed';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>
          <Text style={styles.topTitle}>Consultation Details</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <AppCard>
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <MaterialCommunityIcons color={colors.patient.primary} name="clipboard-text-outline" size={28} />
              </View>
              <View style={styles.summaryCopy}>
                <Text style={styles.summaryTitle}>{consultation.title}</Text>
                <Text style={styles.summaryTime}>Submitted {consultation.submittedAt}</Text>
              </View>
              <StatusBadge status={consultation.status} />
            </View>
          </AppCard>

          <Text style={typography.sectionTitle}>Doctor</Text>
          <AppCard>
            {consultation.doctorName ? (
              <View style={styles.doctorCard}>
                <View style={styles.doctorAvatar}>
                  <MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={29} />
                </View>
                <View>
                  <Text style={styles.doctorName}>{consultation.doctorName}</Text>
                  <Text style={styles.doctorSpecialty}>{consultation.doctorSpecialty}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.waitingCard}>
                <MaterialCommunityIcons color={colors.warning} name="clock-outline" size={25} />
                <View style={styles.summaryCopy}>
                  <Text style={styles.doctorName}>Matching you with a doctor</Text>
                  <Text style={styles.doctorSpecialty}>You will be notified once a doctor accepts the request.</Text>
                </View>
              </View>
            )}
          </AppCard>

          <Text style={typography.sectionTitle}>Your symptoms</Text>
          <AppCard>
            <View style={styles.sectionCard}>
              <Text style={styles.symptoms}>{consultation.symptoms}</Text>
              <View style={styles.durationRow}>
                <MaterialCommunityIcons color={colors.patient.primary} name="clock-outline" size={17} />
                <Text style={styles.durationText}>Duration: {consultation.duration}</Text>
              </View>
            </View>
          </AppCard>

          <Text style={typography.sectionTitle}>Photos</Text>
          <AppCard>
            <View style={styles.sectionCard}>
              {consultation.photos.length > 0 ? (
                <View style={styles.photos}>
                  {consultation.photos.map((photo) => (
                    <Image accessibilityLabel={photo.fileName} key={photo.id} source={{ uri: photo.uri }} style={styles.photo} />
                  ))}
                </View>
              ) : (
                <View style={styles.noPhotos}>
                  <MaterialCommunityIcons color={colors.muted} name="image-outline" size={25} />
                  <Text style={styles.noPhotosText}>No photos attached to this consultation.</Text>
                </View>
              )}
            </View>
          </AppCard>

          <Text style={typography.sectionTitle}>Status timeline</Text>
          <AppCard>
            <View style={styles.timelineCard}>
              {timeline.map((item, index) => (
                <View key={item.title} style={styles.timelineItem}>
                  <View style={styles.timelineRail}>
                    <View style={[styles.timelineDot, index === timeline.length - 1 && styles.timelineDotActive]} />
                    {index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}
                  </View>
                  <View style={styles.timelineCopy}>
                    <Text style={styles.timelineTitle}>{item.title}</Text>
                    <Text style={styles.timelineDetail}>{item.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          </AppCard>

          <AppButton
            icon={completed ? 'file-document-outline' : 'message-text-outline'}
            label={completed ? 'View Summary' : canChat ? 'Chat with Doctor' : 'Chat unavailable'}
            onPress={() => {
              if (canChat) {
                router.push({ pathname: '/chat/[conversationId]', params: { conversationId: 'patient-skin-rash', role: 'patient' } });
              }

              if (completed) {
                router.push({ pathname: '/consultations/[consultationId]/summary', params: { consultationId: consultation.id } });
              }
            }}
            variant={canChat || completed ? 'primary' : 'outline'}
          />
        </ScrollView>
      </SafeAreaView>
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
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  doctorAvatar: {
    alignItems: 'center',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  doctorCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  doctorName: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  doctorSpecialty: {
    color: colors.text,
    fontSize: 12,
    marginTop: 3,
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  durationText: {
    color: colors.patient.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  noPhotos: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  noPhotosText: {
    color: colors.muted,
    fontSize: 12,
  },
  notFound: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  notFoundText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  notFoundTitle: {
    color: colors.navy,
    fontSize: 19,
    fontWeight: '700',
  },
  photo: {
    borderRadius: radius.sm,
    height: 78,
    width: 78,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  safeArea: {
    flex: 1,
  },
  sectionCard: {
    padding: spacing.md,
  },
  summaryCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  summaryCopy: {
    flex: 1,
  },
  summaryIcon: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.md,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  summaryTime: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  summaryTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  symptoms: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
  },
  timelineCard: {
    padding: spacing.md,
  },
  timelineCopy: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineDetail: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },
  timelineDot: {
    backgroundColor: colors.patient.primary,
    borderColor: colors.patient.softStrong,
    borderRadius: radius.pill,
    borderWidth: 3,
    height: 15,
    width: 15,
  },
  timelineDotActive: {
    backgroundColor: colors.success,
    borderColor: colors.successSoft,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timelineLine: {
    backgroundColor: colors.border,
    flex: 1,
    marginBottom: -spacing.xs,
    marginTop: -spacing.xs,
    width: 2,
  },
  timelineRail: {
    alignItems: 'center',
    width: 15,
  },
  timelineTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '700',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  topTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  waitingCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
});
