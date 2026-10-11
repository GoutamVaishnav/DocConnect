import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientNotificationsScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Notifications" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>Notifications</Text><View style={styles.empty}><View style={styles.iconBox}><MaterialCommunityIcons color={colors.patient.primary} name="bell-outline" size={34} /></View><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptyText}>Updates about your consultation and messages will appear here once the notification service is connected.</Text></View></ScrollView></SafeAreaView><BottomNav activeLabel="Alerts" role="patient" /></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1 }, content: { padding: spacing.lg, paddingBottom: spacing.xxl }, empty: { alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing.xxxl }, emptyText: { color: colors.text, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, textAlign: 'center' }, emptyTitle: { color: colors.navy, fontSize: 17, fontWeight: '700', marginTop: spacing.md }, iconBox: { alignItems: 'center', backgroundColor: colors.patient.soft, borderRadius: radius.pill, height: 90, justifyContent: 'center', width: 90 }, safeArea: { flex: 1 } });
