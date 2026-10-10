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

export default function DoctorProfileScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Profile" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primaryDark} name="doctor" size={36} /></View><Text style={typography.sectionTitle}>Dr. Sharma</Text><Text style={styles.specialty}>General Physician</Text><View style={styles.verified}><MaterialCommunityIcons color={colors.success} name="check-circle" size={15} /><Text style={styles.verifiedText}>Verified demo profile</Text></View></View><Text style={typography.sectionTitle}>Professional Profile</Text><AppCard><SettingsRow detail="Dr. Sharma • General Physician" icon="account-tie-outline" label="Professional Information" role="doctor" /><View style={styles.divider} /><SettingsRow detail="Review status and submitted documents" icon="shield-check-outline" label="Verification Status" onPress={() => router.push('/doctor-verification')} role="doctor" /><View style={styles.divider} /><SettingsRow detail="Request availability and notification choices" icon="calendar-check-outline" label="Availability & Notifications" onPress={() => router.push('/doctor-availability')} role="doctor" /></AppCard><Text style={typography.sectionTitle}>Account</Text><AppCard><SettingsRow destructive icon="logout" label="Logout" onPress={() => router.push('/doctor-logout')} role="doctor" /></AppCard></ScrollView></SafeAreaView><BottomNav activeLabel="Profile" role="doctor" /></View>;
}

const styles = StyleSheet.create({ avatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 78, justifyContent: 'center', width: 78 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }, safeArea: { flex: 1 }, specialty: { color: colors.text, fontSize: 12 }, verified: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 5, marginTop: spacing.xs, paddingHorizontal: 9, paddingVertical: 5 }, verifiedText: { color: colors.success, fontSize: 11, fontWeight: '700' }, });
