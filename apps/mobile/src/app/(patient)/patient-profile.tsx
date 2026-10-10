import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientProfileScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Profile" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><Text style={styles.initials}>RS</Text></View><Text style={typography.sectionTitle}>Rohan Sharma</Text><Text style={styles.email}>rohan@example.com</Text></View><AppCard><SettingsRow detail="Rohan Sharma • demo account" icon="account-outline" label="Personal Information" /></AppCard><Text style={typography.sectionTitle}>Health & Settings</Text><AppCard><SettingsRow icon="heart-pulse" label="Medical Profile" onPress={() => router.push('/medical-profile')} /><View style={styles.divider} /><SettingsRow icon="shield-account-outline" label="Privacy & App Settings" onPress={() => router.push('/patient-settings')} /></AppCard><Text style={typography.sectionTitle}>Account</Text><AppCard><SettingsRow destructive icon="logout" label="Logout" onPress={() => router.push('/patient-logout')} /></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.patient.primary} name="information-outline" size={20} /><Text style={styles.noteText}>Profile details are sample UI content and will be managed by secure account APIs later.</Text></View></ScrollView></SafeAreaView><BottomNav activeLabel="Profile" role="patient" /></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.patient.softStrong, borderRadius: radius.pill, height: 78, justifyContent: 'center', width: 78 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, email: { color: colors.muted, fontSize: 12 }, initials: { color: colors.patient.primaryDark, fontSize: 23, fontWeight: '700' }, note: { alignItems: 'flex-start', backgroundColor: colors.patient.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }, safeArea: { flex: 1 },
});
