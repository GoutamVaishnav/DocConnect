import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const notifications = [
  { detail: 'Dr. Mehta is ready to continue your consultation.', icon: 'message-text-outline', time: '20 mins ago', title: 'New message' },
  { detail: 'A doctor accepted your skin rash request.', icon: 'clipboard-check-outline', time: '2 days ago', title: 'Consultation in progress' },
  { detail: 'Your account email has been verified in this demo.', icon: 'shield-check-outline', time: '3 days ago', title: 'Account updated' },
] as const;

export default function PatientNotificationsScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Notifications" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>Notifications</Text><View style={styles.list}>{notifications.map((item) => <AppCard key={item.title}><View style={styles.row}><View style={styles.iconBox}><MaterialCommunityIcons color={colors.patient.primary} name={item.icon} size={21} /></View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.detail}>{item.detail}</Text><Text style={styles.time}>{item.time}</Text></View></View></AppCard>)}</View><View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Notification delivery will be connected to the backend later.</Text></View></ScrollView></SafeAreaView><BottomNav activeLabel="Alerts" role="patient" /></View>;
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, copy: { flex: 1 }, detail: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 3 }, iconBox: { alignItems: 'center', backgroundColor: colors.patient.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }, list: { gap: spacing.sm, marginTop: spacing.sm }, note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, row: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, safeArea: { flex: 1 }, time: { color: colors.muted, fontSize: 10, marginTop: spacing.xs }, title: { color: colors.navy, fontSize: 14, fontWeight: '700' },
});
