import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export default function RequestDetailsScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { acceptRequest, getRequest } = useDoctorRequests();
  const request = requestId ? getRequest(requestId) : undefined;

  function acceptConsultation() {
    if (!request) {
      return;
    }

    const acceptedRequest = acceptRequest(request.id);

    if (acceptedRequest) {
      router.replace({ pathname: '/request-accepted', params: { requestId: acceptedRequest.id } });
    }
  }

  if (!request) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.missingState}>
            <MaterialCommunityIcons color={colors.muted} name="file-question-outline" size={54} />
            <Text style={styles.missingTitle}>Request not found</Text>
            <Text style={styles.missingText}>It may have been removed from this local demo session.</Text>
            <AppButton label="Back to requests" onPress={() => router.replace('/open-requests')} role="doctor" />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const isAccepted = request.status === 'Accepted';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>
          <Text style={styles.topTitle}>Request Details</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.previewRow}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.previewTile}>
                <MaterialCommunityIcons color={colors.doctor.primary} name="image-outline" size={27} />
                <Text style={styles.previewText}>{`Attachment ${item}`}</Text>
              </View>
            ))}
          </View>

          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <MaterialCommunityIcons color={colors.doctor.primaryDark} name="account-outline" size={28} />
            </View>
            <View style={styles.patientCopy}>
              <Text style={typography.sectionTitle}>{request.patientLabel}</Text>
              <Text style={styles.patientMeta}>{`${request.age} years • submitted ${request.submittedAt}`}</Text>
            </View>
            <View style={[styles.statusBadge, isAccepted && styles.statusBadgeAccepted]}>
              <Text style={[styles.statusText, isAccepted && styles.statusTextAccepted]}>{isAccepted ? 'Accepted' : 'New'}</Text>
            </View>
          </View>

          <AppCard>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Symptoms</Text>
              <Text style={styles.symptoms}>{request.symptoms}</Text>
              <View style={styles.divider} />
              <DetailRow label="Duration" value={request.duration} />
              <DetailRow label="Severity" value={request.severity} />
            </View>
          </AppCard>

          <AppCard>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Additional information</Text>
              <Text style={styles.additionalText}>No fever, ongoing treatments, or other medical notes were added in this sample request.</Text>
            </View>
          </AppCard>

          <View style={styles.demoNote}>
            <MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} />
            <Text style={styles.demoNoteText}>This is sample-only information for UI development. It is not a real patient consultation.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isAccepted ? (
            <AppButton
              icon="message-text-outline"
              label="Open Chat"
              onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: `doctor-${request.id}`, role: 'doctor' } })}
              role="doctor"
            />
          ) : (
            <AppButton icon="check-circle-outline" label="Accept Consultation" onPress={acceptConsultation} role="doctor" />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  additionalText: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  cardContent: { padding: spacing.md },
  cardTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  demoNote: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md },
  demoNoteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  detailLabel: { color: colors.text, fontSize: 13 },
  detailRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  detailValue: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  divider: { backgroundColor: colors.border, height: 1, marginTop: spacing.md },
  footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.md },
  missingState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl },
  missingText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' },
  missingTitle: { color: colors.navy, fontSize: 18, fontWeight: '700', marginTop: spacing.xs },
  patientAvatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 },
  patientCopy: { flex: 1 },
  patientHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  patientMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  previewRow: { flexDirection: 'row', gap: spacing.xs },
  previewText: { color: colors.doctor.primaryDark, fontSize: 9, fontWeight: '700', marginTop: 4 },
  previewTile: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderColor: colors.doctor.softStrong, borderRadius: radius.md, borderWidth: 1, flex: 1, height: 86, justifyContent: 'center' },
  safeArea: { flex: 1 },
  statusBadge: { backgroundColor: colors.doctor.soft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statusBadgeAccepted: { backgroundColor: colors.successSoft },
  statusText: { color: colors.doctor.primaryDark, fontSize: 10, fontWeight: '700' },
  statusTextAccepted: { color: colors.success },
  symptoms: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.xs },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
