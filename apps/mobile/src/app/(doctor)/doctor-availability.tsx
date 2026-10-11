import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { useDoctorProfile } from '@/context/doctor-profile';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function Setting({ detail, enabled, label, onChange }: { detail: string; enabled: boolean; label: string; onChange: (value: boolean) => void }) { return <View style={styles.setting}><View style={styles.copy}><Text style={styles.label}>{label}</Text><Text style={styles.detail}>{detail}</Text></View><Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.doctor.primary }} value={enabled} /></View>; }

export default function DoctorAvailabilityScreen() {
  const { error, isLoading, profile, setAvailability } = useDoctorProfile();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRequests, setNewRequests] = useState(true);
  const [messages, setMessages] = useState(true);
  const [system, setSystem] = useState(false);
  const available = profile?.availabilityEnabled ?? false;

  async function updateAvailability(enabled: boolean) {
    try {
      setIsUpdating(true);
      await setAvailability(enabled);
    } catch (nextError) {
      Alert.alert('Could not update availability', nextError instanceof Error ? nextError.message : 'Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Availability & Notifications" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>Availability</Text>{isLoading && !profile ? <View style={styles.loading}><ActivityIndicator color={colors.doctor.primary} /><Text style={styles.detail}>Loading doctor profile…</Text></View> : <AppCard><View style={styles.availability}><View style={styles.availabilityIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="calendar-check-outline" size={22} /></View><View style={styles.copy}><Text style={styles.label}>Available for new requests</Text><Text style={styles.detail}>{profile ? available ? 'You can accept new consultation requests.' : 'New consultation requests are paused.' : 'Create your professional profile before enabling availability.'}</Text></View><Switch accessibilityLabel="Available for new requests" disabled={!profile || isUpdating} onValueChange={(value) => void updateAvailability(value)} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.doctor.primary }} value={available} /></View></AppCard>}<Text style={typography.sectionTitle}>Notification Preferences</Text><AppCard><Setting detail="Receive new consultation requests on this device." enabled={newRequests} label="New Requests" onChange={setNewRequests} /><View style={styles.divider} /><Setting detail="Receive patient chat alerts on this device." enabled={messages} label="Messages" onChange={setMessages} /><View style={styles.divider} /><Setting detail="Receive account and product updates on this device." enabled={system} label="System Notifications" onChange={setSystem} /></AppCard><View style={[styles.note, error && styles.errorNote]}><MaterialCommunityIcons color={error ? '#D93B3B' : colors.doctor.primary} name={error ? 'alert-circle-outline' : 'shield-check-outline'} size={20} /><Text style={styles.noteText}>{error ?? 'Availability is saved to your doctor profile. Notification preferences remain device-only until notification APIs are added.'}</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({
  availability: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md }, availabilityIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, copy: { flex: 1 }, detail: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, errorNote: { backgroundColor: '#FFF0F0' }, label: { color: colors.navy, fontSize: 14, fontWeight: '700' }, loading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.lg }, note: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, safeArea: { flex: 1 }, setting: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 76, paddingHorizontal: spacing.md },
});
