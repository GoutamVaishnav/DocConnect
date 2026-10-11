import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { FormField } from '@/components/form-field';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { useAuth } from '@/context/auth';
import { useDoctorProfile } from '@/context/doctor-profile';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function ProfileForm({ initialFullName, initialRegistrationNumber, initialSpecialty }: { initialFullName: string; initialRegistrationNumber: string; initialSpecialty: string }) {
  const { saveProfile } = useDoctorProfile();
  const [fullName, setFullName] = useState(initialFullName);
  const [specialty, setSpecialty] = useState(initialSpecialty);
  const [registrationNumber, setRegistrationNumber] = useState(initialRegistrationNumber);
  const [isSaving, setIsSaving] = useState(false);

  async function submitProfile() {
    if (fullName.trim().length < 2 || specialty.trim().length < 2) {
      Alert.alert('Missing information', 'Enter your full name and specialty.');
      return;
    }
    try {
      setIsSaving(true);
      await saveProfile({ fullName: fullName.trim(), specialty: specialty.trim(), ...(registrationNumber.trim() ? { registrationNumber: registrationNumber.trim() } : {}) });
      Alert.alert('Profile saved', 'Your doctor profile is ready. You can now enable availability for consultation requests.');
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return <AppCard><View style={styles.form}><Text style={styles.formTitle}>Professional Information</Text><FormField accessibilityLabel="Doctor full name" autoCapitalize="words" icon="account-tie-outline" onChangeText={setFullName} placeholder="Full name" value={fullName} /><FormField accessibilityLabel="Specialty" autoCapitalize="words" icon="stethoscope" onChangeText={setSpecialty} placeholder="Specialty" value={specialty} /><FormField accessibilityLabel="Registration number" autoCapitalize="characters" icon="card-account-details-outline" onChangeText={setRegistrationNumber} placeholder="Registration number (optional)" value={registrationNumber} /><AppButton label="Save Professional Profile" loading={isSaving} onPress={() => void submitProfile()} role="doctor" /></View></AppCard>;
}

export default function DoctorProfileScreen() {
  const { session } = useAuth();
  const { error, isLoading, profile } = useDoctorProfile();
  const name = profile?.fullName ?? 'Set up your profile';
  const verificationLabel = profile?.verificationStatus === 'VERIFIED' ? 'Verified' : profile?.verificationStatus === 'REJECTED' ? 'Verification requires attention' : 'Verification pending';

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Profile" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.profile}><View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primaryDark} name="doctor" size={36} /></View><Text style={typography.sectionTitle}>{name}</Text><Text style={styles.specialty}>{profile?.specialty ?? session?.user.email}</Text>{profile ? <View style={[styles.verified, profile.verificationStatus !== 'VERIFIED' && styles.pending]}><MaterialCommunityIcons color={profile.verificationStatus === 'VERIFIED' ? colors.success : colors.warning} name={profile.verificationStatus === 'VERIFIED' ? 'check-circle' : 'clock-outline'} size={15} /><Text style={[styles.verifiedText, profile.verificationStatus !== 'VERIFIED' && styles.pendingText]}>{verificationLabel}</Text></View> : null}</View>{isLoading && !profile ? <View style={styles.loading}><ActivityIndicator color={colors.doctor.primary} /><Text style={styles.loadingText}>Loading doctor profile…</Text></View> : <ProfileForm key={profile ? `${profile.fullName}-${profile.specialty}-${profile.registrationNumber ?? ''}` : 'new-profile'} initialFullName={profile?.fullName ?? ''} initialRegistrationNumber={profile?.registrationNumber ?? ''} initialSpecialty={profile?.specialty ?? ''} />}<Text style={typography.sectionTitle}>Consultation Settings</Text><AppCard><SettingsRow detail={profile?.availabilityEnabled ? 'You can accept new consultation requests' : 'New consultation requests are paused'} icon="calendar-check-outline" label="Availability" onPress={() => router.push('/doctor-availability')} role="doctor" /><View style={styles.divider} /><SettingsRow detail="Review profile status" icon="shield-check-outline" label="Verification Status" onPress={() => router.push('/doctor-verification')} role="doctor" /></AppCard><Text style={typography.sectionTitle}>Account</Text><AppCard><SettingsRow destructive icon="logout" label="Logout" onPress={() => router.push('/doctor-logout')} role="doctor" /></AppCard>{error ? <View style={styles.error}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={20} /><Text style={styles.errorText}>{error}</Text></View> : null}</ScrollView></SafeAreaView><BottomNav activeLabel="Profile" role="doctor" /></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 78, justifyContent: 'center', width: 78 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, error: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, form: { gap: spacing.sm, padding: spacing.md }, formTitle: { color: colors.navy, fontSize: 15, fontWeight: '700' }, loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.xl }, loadingText: { color: colors.muted, fontSize: 12 }, pending: { backgroundColor: colors.warningSoft }, pendingText: { color: colors.warning }, profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md }, safeArea: { flex: 1 }, specialty: { color: colors.text, fontSize: 12 }, verified: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.pill, flexDirection: 'row', gap: 5, marginTop: spacing.xs, paddingHorizontal: 9, paddingVertical: 5 }, verifiedText: { color: colors.success, fontSize: 11, fontWeight: '700' },
});
