import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { formatConsultationDate } from '@/context/consultation-draft';
import { useDoctorRequests, type RequestPriority } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Filter = 'All' | 'Waiting' | 'Urgent';
const filters: Filter[] = ['All', 'Waiting', 'Urgent'];

function filterByPriority(filter: Filter, priority: RequestPriority) {
  return filter === 'All' || (filter === 'Urgent' ? priority === 'Urgent' : priority === 'Standard');
}

export default function OpenRequestsScreen() {
  const { isLoading, loadError, openRequests, refreshRequests } = useDoctorRequests();
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const requests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return openRequests.filter((request) => {
      const matchesQuery = normalizedQuery.length === 0 || `${request.patientLabel} ${request.concern}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && filterByPriority(filter, request.priority);
    });
  }, [filter, openRequests, query]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><Text style={styles.topTitle}>Open Requests</Text><View style={styles.backButton} /></View>
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={() => void refreshRequests()} refreshing={isLoading} />} showsVerticalScrollIndicator={false}>
          <Text style={typography.screenTitle}>Open Requests</Text>
          <Text style={styles.subtitle}>Review consultation requests available to you.</Text>
          <View style={styles.searchBox}><MaterialCommunityIcons color={colors.muted} name="magnify" size={21} /><TextInput accessibilityLabel="Search requests" autoCapitalize="none" onChangeText={setQuery} placeholder="Search by concern or patient" placeholderTextColor={colors.muted} style={styles.searchInput} value={query} /></View>
          <ScrollView contentContainerStyle={styles.filterRow} horizontal showsHorizontalScrollIndicator={false}>{filters.map((option) => { const active = filter === option; const count = option === 'All' ? openRequests.length : openRequests.filter((request) => filterByPriority(option, request.priority)).length; return <Pressable accessibilityRole="tab" accessibilityState={{ selected: active }} key={option} onPress={() => setFilter(option)} style={[styles.filter, active && styles.filterActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{`${option} (${count})`}</Text></Pressable>; })}</ScrollView>

          {isLoading && requests.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.doctor.primary} /><Text style={styles.loadingText}>Loading requests…</Text></View> : null}
          <View style={styles.list}>{requests.map((request) => <AppCard key={request.id}><Pressable accessibilityLabel={`View ${request.concern} request from ${request.patientLabel}`} onPress={() => router.push({ pathname: '/open-requests/[requestId]', params: { requestId: request.id } })} style={styles.requestCard}><View style={[styles.requestIcon, request.priority === 'Urgent' && styles.requestIconUrgent]}><MaterialCommunityIcons color={request.priority === 'Urgent' ? colors.warning : colors.doctor.primary} name="clipboard-pulse-outline" size={26} /></View><View style={styles.requestCopy}><View style={styles.requestTitleRow}><Text style={styles.patientLabel}>{request.patientLabel}</Text><View style={[styles.priorityBadge, request.priority === 'Urgent' && styles.priorityBadgeUrgent]}><Text style={[styles.priorityText, request.priority === 'Urgent' && styles.priorityTextUrgent]}>{request.priority === 'Urgent' ? 'Urgent' : 'New'}</Text></View></View><Text style={styles.concern}>{request.concern}</Text><Text style={styles.meta}>{`${formatConsultationDate(request.submittedAt)} • ${request.duration}`}</Text></View><MaterialCommunityIcons color={colors.muted} name="chevron-right" size={23} /></Pressable></AppCard>)}</View>

          {!isLoading && requests.length === 0 ? <View style={styles.emptyState}><MaterialCommunityIcons color={colors.muted} name="inbox-outline" size={38} /><Text style={styles.emptyTitle}>No matching requests</Text><Text style={styles.emptyText}>Try a different filter or pull down to refresh.</Text></View> : null}
          {loadError ? <View style={styles.errorNote}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><View style={styles.errorCopy}><Text style={styles.errorText}>{loadError}</Text><Pressable accessibilityRole="button" onPress={() => void refreshRequests()}><Text style={styles.retryText}>Try again</Text></Pressable></View></View> : <View style={styles.secureNote}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} /><Text style={styles.secureNoteText}>Only consultations that are available to your doctor account appear here.</Text></View>}
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="Requests" role="doctor" />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, concern: { color: colors.text, fontSize: 13, marginTop: 3 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyState: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxxl }, emptyText: { color: colors.text, fontSize: 13, marginTop: spacing.xs, textAlign: 'center' }, emptyTitle: { color: colors.navy, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  errorCopy: { flex: 1, gap: spacing.xs }, errorNote: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.md }, errorText: { color: colors.text, fontSize: 12, lineHeight: 18 }, retryText: { color: colors.doctor.primary, fontSize: 12, fontWeight: '700' },
  filter: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.xs }, filterActive: { backgroundColor: colors.doctor.primary, borderColor: colors.doctor.primary }, filterRow: { gap: spacing.xs, marginBottom: spacing.md, marginTop: spacing.xs }, filterText: { color: colors.text, fontSize: 12, fontWeight: '700' }, filterTextActive: { color: colors.surface }, list: { gap: spacing.sm }, loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.xl }, loadingText: { color: colors.muted, fontSize: 12 }, meta: { color: colors.muted, fontSize: 10, marginTop: 5 }, patientLabel: { color: colors.navy, fontSize: 14, fontWeight: '700' }, priorityBadge: { backgroundColor: colors.doctor.soft, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4 }, priorityBadgeUrgent: { backgroundColor: colors.warningSoft }, priorityText: { color: colors.doctor.primaryDark, fontSize: 10, fontWeight: '700' }, priorityTextUrgent: { color: colors.warning }, requestCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }, requestCopy: { flex: 1 }, requestIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 56, justifyContent: 'center', width: 56 }, requestIconUrgent: { backgroundColor: colors.warningSoft }, requestTitleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'space-between' }, safeArea: { flex: 1 }, searchBox: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, paddingHorizontal: spacing.sm }, searchInput: { color: colors.navy, flex: 1, fontSize: 13, minHeight: 46, paddingVertical: spacing.xs }, secureNote: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.md }, secureNoteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, subtitle: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.xs }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
