import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { StatusBadge } from '@/components/status-badge';
import { formatConsultationDate, useConsultationDraft, type ConsultationStatus } from '@/context/consultation-draft';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Filter = 'All' | ConsultationStatus;

const filters: Filter[] = ['All', 'Pending', 'In Progress', 'Completed', 'Cancelled'];

export default function ConsultationsScreen() {
  const { consultations, isLoading, loadError, refreshConsultations } = useConsultationDraft();
  const [filter, setFilter] = useState<Filter>('All');
  const filteredConsultations = useMemo(
    () => consultations.filter((consultation) => filter === 'All' || consultation.status === filter),
    [consultations, filter],
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr('/home')} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>
          <Text style={styles.topTitle}>My Consultations</Text>
          <View style={styles.backButton} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl onRefresh={() => void refreshConsultations()} refreshing={isLoading} />}
          showsVerticalScrollIndicator={false}
        >
          <Text style={typography.screenTitle}>My Consultations</Text>
          <Text style={styles.subtitle}>Track your consultation requests and doctor updates.</Text>

          <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>
            {filters.map((option) => {
              const active = filter === option;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  key={option}
                  onPress={() => setFilter(option)}
                  style={[styles.filter, active && styles.filterActive]}
                >
                  <Text style={[styles.filterText, active && styles.filterTextActive]}>{option}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.list}>
            {filteredConsultations.map((consultation) => (
              <AppCard key={consultation.id}>
                <Pressable
                  accessibilityLabel={`${consultation.title}, ${consultation.status}`}
                  onPress={() => router.push({ pathname: '/consultations/[consultationId]', params: { consultationId: consultation.id } })}
                  style={styles.cardPressable}
                >
                  <View style={[styles.caseIcon, consultation.status === 'Completed' && styles.caseIconCompleted]}>
                    <MaterialCommunityIcons
                      color={consultation.status === 'Completed' ? colors.success : colors.patient.primary}
                      name={consultation.attachments.length > 0 ? 'image-multiple-outline' : 'clipboard-text-outline'}
                      size={25}
                    />
                  </View>
                  <View style={styles.caseCopy}>
                    <Text style={styles.caseTitle}>{consultation.title}</Text>
                    <Text style={styles.caseDoctor}>
                      {consultation.doctorName ?? 'Waiting for a doctor'}
                    </Text>
                    <Text style={styles.caseTime}>{formatConsultationDate(consultation.submittedAt)}</Text>
                  </View>
                  <View style={styles.caseMeta}>
                    <StatusBadge status={consultation.status} />
                    <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} />
                  </View>
                </Pressable>
              </AppCard>
            ))}
          </View>

          {filteredConsultations.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons color={colors.muted} name="clipboard-text-outline" size={38} />
              <Text style={styles.emptyTitle}>No consultations here</Text>
              <Text style={styles.emptyText}>Choose another filter or start a new consultation from Home.</Text>
            </View>
          ) : null}

          {loadError ? (
            <View style={styles.errorNote}>
              <MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} />
              <View style={styles.errorCopy}>
                <Text style={styles.errorText}>{loadError}</Text>
                <Pressable accessibilityRole="button" onPress={() => void refreshConsultations()}>
                  <Text style={styles.retryText}>Try again</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="Consultations" role="patient" />
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
  cardPressable: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  caseCopy: {
    flex: 1,
  },
  caseDoctor: {
    color: colors.text,
    fontSize: 12,
    marginTop: 2,
  },
  caseIcon: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.sm,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  caseIconCompleted: {
    backgroundColor: colors.successSoft,
  },
  caseMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  caseTime: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 5,
  },
  caseTitle: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  errorCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  errorNote: {
    alignItems: 'flex-start',
    backgroundColor: '#FFF0F0',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  retryText: {
    color: colors.patient.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  emptyTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  filter: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filterActive: {
    backgroundColor: colors.patient.primary,
    borderColor: colors.patient.primary,
  },
  filterRow: {
    gap: spacing.xs,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  filterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.surface,
  },
  list: {
    gap: spacing.sm,
  },
  safeArea: {
    flex: 1,
  },
  subtitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
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
});
