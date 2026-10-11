import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { useDoctorProfile } from '@/context/doctor-profile';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function DoctorVerificationScreen() {
  const { profile } = useDoctorProfile();
  const status = profile?.verificationStatus ?? 'PENDING';
  const isVerified = status === 'VERIFIED';
  const isRejected = status === 'REJECTED';
  const title = isVerified ? 'Verification complete' : isRejected ? 'Verification needs attention' : 'Verification pending';
  const message = isVerified ? 'Your professional profile has been verified.' : isRejected ? 'Please contact support to review your professional profile.' : 'Your professional profile is waiting for verification.';

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Verification" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.hero}><View style={[styles.heroIcon, isVerified ? styles.verifiedIcon : isRejected ? styles.rejectedIcon : styles.pendingIcon]}><MaterialCommunityIcons color={isVerified ? colors.success : isRejected ? '#D93B3B' : colors.warning} name={isVerified ? 'shield-check-outline' : isRejected ? 'alert-circle-outline' : 'clock-outline'} size={47} /></View><Text style={typography.sectionTitle}>{title}</Text><Text style={styles.heroText}>{message}</Text></View><AppCard><View style={styles.card}><Text style={styles.label}>Current status</Text><Text style={[styles.status, isVerified ? styles.verifiedText : isRejected ? styles.rejectedText : styles.pendingText]}>{status}</Text><Text style={styles.detail}>Document upload and reviewer controls will be added with the verification backend service.</Text></View></AppCard></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ card: { gap: spacing.xs, padding: spacing.md }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, detail: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: spacing.sm }, hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }, heroIcon: { alignItems: 'center', borderRadius: radius.pill, height: 108, justifyContent: 'center', marginBottom: spacing.md, width: 108 }, heroText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' }, label: { color: colors.muted, fontSize: 11 }, pendingIcon: { backgroundColor: colors.warningSoft }, pendingText: { color: colors.warning }, rejectedIcon: { backgroundColor: '#FFF0F0' }, rejectedText: { color: '#D93B3B' }, safeArea: { flex: 1 }, status: { fontSize: 15, fontWeight: '700' }, verifiedIcon: { backgroundColor: colors.successSoft }, verifiedText: { color: colors.success } });
