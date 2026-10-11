import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { useAuth } from '@/context/auth';
import { usePatientProfile } from '@/context/patient-profile';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

export default function PatientProfileScreen() {
  const { session } = useAuth();
  const { error, isLoading, profile } = usePatientProfile();
  const name = profile?.fullName || session?.user.email || 'Patient';
  const email = session?.user.email || 'Email unavailable';

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Profile" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><Text style={styles.initials}>{getInitials(name)}</Text></View><Text style={typography.sectionTitle}>{name}</Text><Text style={styles.email}>{email}</Text></View>{isLoading && !profile ? <View style={styles.loading}><ActivityIndicator color={colors.patient.primary} /><Text style={styles.loadingText}>Loading profile…</Text></View> : null}<AppCard><SettingsRow detail={profile?.fullName || 'Name not set'} icon="account-outline" label="Personal Information" /></AppCard><Text style={typography.sectionTitle}>Health & Settings</Text><AppCard><SettingsRow icon="heart-pulse" label="Medical Profile" onPress={() => router.push('/medical-profile')} /><View style={styles.divider} /><SettingsRow icon="shield-account-outline" label="Privacy & App Settings" onPress={() => router.push('/patient-settings')} /></AppCard><Text style={typography.sectionTitle}>Account</Text><AppCard><SettingsRow destructive icon="logout" label="Logout" onPress={() => router.push('/patient-logout')} /></AppCard>{error ? <View style={styles.error}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><Text style={styles.errorText}>{error}</Text></View> : null}</ScrollView></SafeAreaView><BottomNav activeLabel="Profile" role="patient" /></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.patient.softStrong, borderRadius: radius.pill, height: 78, justifyContent: 'center', width: 78 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, email: { color: colors.muted, fontSize: 12 }, error: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, initials: { color: colors.patient.primaryDark, fontSize: 23, fontWeight: '700' }, loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.md }, loadingText: { color: colors.muted, fontSize: 12 }, profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }, safeArea: { flex: 1 },
});
