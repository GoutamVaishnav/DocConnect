import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { useConsultationDraft } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientMessagesScreen() {
  const { consultations, isLoading, loadError, refreshConsultations } = useConsultationDraft();
  const activeConsultations = consultations.filter((consultation) => consultation.status === 'In Progress');

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Messages" />
        <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl onRefresh={() => void refreshConsultations()} refreshing={isLoading} />} showsVerticalScrollIndicator={false}>
          <Text style={typography.screenTitle}>Messages</Text>
          <Text style={styles.subtitle}>Secure chats from your active consultations.</Text>

          {isLoading && activeConsultations.length === 0 ? <View style={styles.loading}><ActivityIndicator color={colors.patient.primary} /><Text style={styles.loadingText}>Loading messages…</Text></View> : null}

          {activeConsultations.map((consultation) => (
            <AppCard key={consultation.id}>
              <Pressable accessibilityLabel={`Chat with ${consultation.doctorName ?? 'your doctor'}`} onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: consultation.id, role: 'patient' } })} style={styles.messageRow}>
                <View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={24} /></View>
                <View style={styles.copy}><Text style={styles.name}>{consultation.doctorName ?? 'Your doctor'}</Text><Text numberOfLines={1} style={styles.preview}>{consultation.title}</Text></View>
                <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} />
              </Pressable>
            </AppCard>
          ))}

          {!isLoading && activeConsultations.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons color={colors.muted} name="message-lock-outline" size={36} /><Text style={styles.emptyTitle}>No active chats</Text><Text style={styles.emptyText}>A secure chat becomes available when a doctor accepts one of your consultations.</Text></View> : null}

          {loadError ? <View style={styles.note}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><Text style={styles.noteText}>{loadError}</Text></View> : null}
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="Messages" role="patient" />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 54, justifyContent: 'center', width: 54 },
  container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl }, copy: { flex: 1 },
  empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.xxxl }, emptyText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' }, emptyTitle: { color: colors.navy, fontSize: 16, fontWeight: '700', marginTop: spacing.sm },
  loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.xl }, loadingText: { color: colors.muted, fontSize: 12 },
  messageRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }, name: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  note: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, preview: { color: colors.text, fontSize: 12, marginTop: 3 }, safeArea: { flex: 1 }, subtitle: { color: colors.text, fontSize: 14, marginTop: spacing.xs },
});
