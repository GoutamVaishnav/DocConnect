import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function MyCasesScreen() {
  const { acceptedCases, completedCases } = useDoctorRequests();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>
          <Text style={styles.topTitle}>My Cases</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={typography.screenTitle}>My Cases</Text>
          <Text style={styles.subtitle}>Active and completed sample cases in this local session.</Text>

          {acceptedCases.length > 0 ? (
            <View style={styles.list}>
              {acceptedCases.map((caseItem) => (
                <AppCard key={caseItem.id}>
                  <Pressable
                    accessibilityLabel={`View ${caseItem.concern} case`}
                    onPress={() => router.push({ pathname: '/cases/[caseId]', params: { caseId: caseItem.id } })}
                    style={styles.caseCard}
                  >
                    <View style={styles.caseIcon}>
                      <MaterialCommunityIcons color={colors.doctor.primary} name="briefcase-check-outline" size={25} />
                    </View>
                    <View style={styles.caseCopy}>
                      <Text style={styles.caseTitle}>{caseItem.patientLabel}</Text>
                      <Text style={styles.caseConcern}>{caseItem.concern}</Text>
                      <Text style={styles.caseTime}>Accepted just now</Text>
                    </View>
                    <View style={styles.acceptedBadge}>
                      <Text style={styles.acceptedText}>Active</Text>
                    </View>
                  </Pressable>
                </AppCard>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons color={colors.muted} name="briefcase-outline" size={43} />
              <Text style={styles.emptyTitle}>No local cases yet</Text>
              <Text style={styles.emptyText}>Accept a sample request to see it here.</Text>
              <AppButton label="Open Requests" onPress={() => router.replace('/open-requests')} role="doctor" variant="outline" />
            </View>
          )}

          {completedCases.length > 0 ? (
            <View style={styles.completedSection}>
              <Text style={typography.sectionTitle}>Recently Completed</Text>
              <View style={styles.list}>
                {completedCases.map((caseItem) => (
                  <AppCard key={caseItem.id}>
                    <Pressable
                      accessibilityLabel={`View completed ${caseItem.concern} case`}
                      onPress={() => router.push({ pathname: '/cases/[caseId]', params: { caseId: caseItem.id } })}
                      style={styles.caseCard}
                    >
                      <View style={[styles.caseIcon, styles.completedIcon]}><MaterialCommunityIcons color={colors.success} name="check-circle-outline" size={25} /></View>
                      <View style={styles.caseCopy}><Text style={styles.caseTitle}>{caseItem.patientLabel}</Text><Text style={styles.caseConcern}>{caseItem.concern}</Text><Text style={styles.caseTime}>Completed locally</Text></View>
                      <View style={styles.completedBadge}><Text style={styles.completedText}>Completed</Text></View>
                    </Pressable>
                  </AppCard>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="My Cases" role="doctor" />
    </View>
  );
}

const styles = StyleSheet.create({
  acceptedBadge: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  acceptedText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  caseCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  caseConcern: { color: colors.text, fontSize: 12, marginTop: 2 },
  caseCopy: { flex: 1 },
  caseIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 54, justifyContent: 'center', width: 54 },
  caseTime: { color: colors.muted, fontSize: 10, marginTop: 5 },
  caseTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  container: { backgroundColor: colors.canvas, flex: 1 },
  completedBadge: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  completedIcon: { backgroundColor: colors.successSoft },
  completedSection: { gap: spacing.sm, marginTop: spacing.xl },
  completedText: { color: colors.success, fontSize: 10, fontWeight: '700' },
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl },
  emptyText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.md, textAlign: 'center' },
  emptyTitle: { color: colors.navy, fontSize: 17, fontWeight: '700', marginTop: spacing.xs },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  safeArea: { flex: 1 },
  subtitle: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.xs },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
