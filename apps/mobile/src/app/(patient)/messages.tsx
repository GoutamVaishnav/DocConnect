import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientMessagesScreen() {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScreenHeader title="Messages" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={typography.screenTitle}>Messages</Text>
          <Text style={styles.subtitle}>Your local demo conversations with doctors.</Text>
          <AppCard>
            <Pressable accessibilityLabel="Chat with Dr. Mehta" onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: 'patient-skin-rash', role: 'patient' } })} style={styles.messageRow}>
              <View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={24} /></View>
              <View style={styles.copy}><Text style={styles.name}>Dr. Mehta</Text><Text numberOfLines={1} style={styles.preview}>I have reviewed your photos. Can you tell me when the rash began?</Text></View>
              <View style={styles.meta}><Text style={styles.time}>10:21 AM</Text><View style={styles.unread}><Text style={styles.unreadText}>1</Text></View></View>
            </Pressable>
          </AppCard>
          <View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Messages are stored only in local UI memory until secure chat and backend services are added.</Text></View>
        </ScrollView>
      </SafeAreaView>
      <BottomNav activeLabel="Messages" role="patient" />
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 54, justifyContent: 'center', width: 54 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  copy: { flex: 1 },
  messageRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  meta: { alignItems: 'flex-end', gap: spacing.xs },
  name: { color: colors.navy, fontSize: 15, fontWeight: '700' },
  note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.md },
  noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  preview: { color: colors.text, fontSize: 12, marginTop: 3 },
  safeArea: { flex: 1 },
  subtitle: { color: colors.text, fontSize: 14, marginTop: spacing.xs },
  time: { color: colors.muted, fontSize: 10 },
  unread: { alignItems: 'center', backgroundColor: colors.patient.primary, borderRadius: radius.pill, height: 18, justifyContent: 'center', width: 18 },
  unreadText: { color: colors.surface, fontSize: 10, fontWeight: '700' },
});
