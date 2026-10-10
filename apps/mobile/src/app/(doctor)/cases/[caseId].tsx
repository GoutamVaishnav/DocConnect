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

export default function CaseDetailsScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { getRequest, getSummary } = useDoctorRequests();
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;
  const summary = caseItem ? getSummary(caseItem.id) : undefined;

  if (!caseItem || caseItem.status === 'Open') {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.emptyState}>
          <MaterialCommunityIcons color={colors.muted} name="briefcase-remove-outline" size={52} />
          <Text style={styles.emptyTitle}>Case unavailable</Text>
          <Text style={styles.emptyText}>Accept the request before opening its case workspace.</Text>
          <AppButton label="Open Requests" onPress={() => router.replace('/open-requests')} role="doctor" />
        </SafeAreaView>
      </View>
    );
  }

  const complete = caseItem.status === 'Completed';

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
            <View style={styles.patientCard}>
              <View style={styles.patientIcon}>
                <MaterialCommunityIcons color={colors.doctor.primary} name="account-outline" size={29} />
              </View>
              <View style={styles.patientCopy}>
                <Text style={styles.patientName}>{caseItem.patientLabel}</Text>
                <Text style={styles.patientMeta}>{`${caseItem.concern} • ${caseItem.age} years`}</Text>
              </View>
              <View style={[styles.statusBadge, complete && styles.statusBadgeComplete]}>
                <Text style={[styles.statusText, complete && styles.statusTextComplete]}>{complete ? 'Completed' : 'In progress'}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <Pressable
              accessibilityLabel="View patient information"
              onPress={() => router.push({ pathname: '/cases/[caseId]/patient', params: { caseId: caseItem.id } })}
              style={styles.row}
            >
              <View style={styles.rowIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="account-card-outline" size={22} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>Patient Information</Text>
                <Text style={styles.rowDetail}>Profile and local demo history</Text>
              </View>
              <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} />
            </Pressable>
          </AppCard>

          <Text style={typography.sectionTitle}>Consultation request</Text>
          <AppCard>
            <View style={styles.sectionCard}>
              <Text style={styles.symptoms}>{caseItem.symptoms}</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Duration</Text><Text style={styles.infoValue}>{caseItem.duration}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>Severity</Text><Text style={styles.infoValue}>{caseItem.severity}</Text></View>
            </View>
          </AppCard>

          <Text style={typography.sectionTitle}>Consultation Summary</Text>
          <AppCard>
            <Pressable
              accessibilityLabel="Prepare consultation summary"
              onPress={() => router.push({ pathname: '/cases/[caseId]/summary', params: { caseId: caseItem.id } })}
              style={styles.row}
            >
              <View style={styles.rowIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="clipboard-text-outline" size={22} /></View>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{summary ? 'Summary saved locally' : 'Prepare Summary'}</Text>
                <Text style={styles.rowDetail}>{summary?.prescriptionName || 'Notes, instructions, and prescription placeholder'}</Text>
              </View>
              <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} />
            </Pressable>
          </AppCard>

          <View style={styles.demoNote}>
            <MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} />
            <Text style={styles.demoText}>This workspace uses sample data only. Saved notes and completion status remain local to this app session.</Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {complete ? (
            <AppButton label="View Summary" onPress={() => router.push({ pathname: '/cases/[caseId]/summary', params: { caseId: caseItem.id } })} role="doctor" />
          ) : (
            <AppButton label="Open Chat" icon="message-text-outline" onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: `doctor-${caseItem.id}`, role: 'doctor' } })} role="doctor" />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  demoNote: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md },
  demoText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  emptyState: { alignItems: 'center', flex: 1, gap: spacing.sm, justifyContent: 'center', paddingHorizontal: spacing.xl },
  emptyText: { color: colors.text, fontSize: 13, marginBottom: spacing.md, textAlign: 'center' },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '700' },
  footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, padding: spacing.md },
  infoLabel: { color: colors.text, fontSize: 13 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingTop: spacing.sm },
  infoValue: { color: colors.navy, fontSize: 13, fontWeight: '700' },
  patientCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  patientCopy: { flex: 1 },
  patientIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 54, justifyContent: 'center', width: 54 },
  patientMeta: { color: colors.text, fontSize: 12, marginTop: 3 },
  patientName: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  rowCopy: { flex: 1 },
  rowDetail: { color: colors.muted, fontSize: 11, marginTop: 3 },
  rowIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 },
  rowTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  safeArea: { flex: 1 },
  sectionCard: { padding: spacing.md },
  statusBadge: { backgroundColor: colors.doctor.soft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  statusBadgeComplete: { backgroundColor: colors.successSoft },
  statusText: { color: colors.doctor.primaryDark, fontSize: 10, fontWeight: '700' },
  statusTextComplete: { color: colors.success },
  symptoms: { color: colors.text, fontSize: 13, lineHeight: 20 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
