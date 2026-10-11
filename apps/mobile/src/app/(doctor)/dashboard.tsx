import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { MetricCard } from '@/components/metric-card';
import { formatConsultationDate } from '@/context/consultation-draft';
import { useDoctorRequests } from '@/context/doctor-requests';
import { useDoctorProfile } from '@/context/doctor-profile';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function DoctorDashboardScreen() {
  const { activeCases, completedCases, openRequests } = useDoctorRequests();
  const { profile, setAvailability } = useDoctorProfile();
  const available = profile?.availabilityEnabled ?? false;
  const isVerified = profile?.verificationStatus === 'VERIFIED';
  const verificationMessage = !profile
    ? 'Complete your professional profile to start verification.'
    : isVerified
      ? 'Your professional profile is verified.'
      : profile.verificationStatus === 'REJECTED'
        ? 'Your verification needs attention. Please review your profile.'
        : 'Your professional profile is waiting for verification.';
  const activity = useMemo(() => [
    ...openRequests.slice(0, 1).map((request) => ({ detail: formatConsultationDate(request.submittedAt), icon: 'inbox-arrow-down-outline' as const, route: '/open-requests' as const, title: `New request from ${request.patientLabel}` })),
    ...activeCases.slice(0, 1).map((caseItem) => ({ detail: caseItem.acceptedAt ? formatConsultationDate(caseItem.acceptedAt) : 'Recently accepted', icon: 'message-text-outline' as const, route: '/my-cases' as const, title: `Active case: ${caseItem.concern}` })),
    ...completedCases.slice(0, 1).map((caseItem) => ({ detail: caseItem.completedAt ? formatConsultationDate(caseItem.completedAt) : 'Recently completed', icon: 'check-circle-outline' as const, route: '/my-cases' as const, title: `Completed: ${caseItem.concern}` })),
  ].slice(0, 3), [activeCases, completedCases, openRequests]);

  async function updateAvailability(enabled: boolean) {
    try {
      await setAvailability(enabled);
    } catch (error) {
      Alert.alert('Could not update availability', error instanceof Error ? error.message : 'Please update your doctor profile first.');
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons color={colors.doctor.primaryDark} name="doctor" size={28} />
            </View>
            <View style={styles.greeting}>
              <Text style={styles.name}>{profile?.fullName ?? 'Doctor profile required'}</Text>
              <Text style={styles.specialty}>{profile?.specialty ?? 'Complete your professional profile'}</Text>
            </View>
            <Pressable
              accessibilityLabel="Notifications"
              onPress={() => router.push('/doctor-notifications')}
              style={styles.bell}
            >
              <MaterialCommunityIcons color={colors.navy} name="bell-outline" size={23} />
            </Pressable>
          </View>

          <AppCard>
            <View style={styles.availability}>
              <View style={styles.availabilityCopy}>
                <View style={styles.availableIcon}>
                  <MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} />
                </View>
                <View>
                  <Text style={styles.availableTitle}>Available</Text>
                  <Text style={styles.availableDescription}>
                    {profile ? available ? 'You can receive new requests' : 'New requests are paused' : 'Complete profile to accept requests'}
                  </Text>
                </View>
              </View>
              <Switch
                accessibilityLabel="Change availability"
                disabled={!profile}
                onValueChange={(value) => void updateAvailability(value)}
                thumbColor={colors.surface}
                trackColor={{ false: colors.border, true: colors.doctor.primary }}
                value={available}
              />
            </View>
          </AppCard>

          <View style={styles.metrics}>
            <MetricCard label="New Requests" role="doctor" value={String(openRequests.length)} />
            <MetricCard label="Active Cases" role="doctor" value={String(activeCases.length)} />
            <MetricCard label="Completed" role="doctor" value={String(completedCases.length)} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={typography.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => router.push('/doctor-notifications')}>
              <Text style={styles.link}>View all</Text>
            </Pressable>
          </View>

          <AppCard>
            <View style={styles.activityList}>
              {activity.length > 0 ? activity.map((item, index) => (
                <Pressable
                  key={item.title}
                  onPress={() => {
                    router.push(item.route);
                  }}
                  style={[styles.activityItem, index !== activity.length - 1 && styles.activityBorder]}
                >
                  <View style={styles.activityIcon}>
                    <MaterialCommunityIcons color={colors.doctor.primary} name={item.icon} size={20} />
                  </View>
                  <View style={styles.activityCopy}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activityDetail}>{item.detail}</Text>
                  </View>
                  <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={21} />
                </Pressable>
              )) : <View style={styles.noActivity}><Text style={styles.noActivityText}>New consultation activity will appear here.</Text></View>}
            </View>
          </AppCard>

          <View style={styles.verifiedCard}>
            <MaterialCommunityIcons color={isVerified ? colors.success : colors.warning} name={isVerified ? 'check-decagram' : 'clock-outline'} size={22} />
            <Text style={styles.verifiedText}>{verificationMessage}</Text>
          </View>

          <AppButton
            icon="inbox-arrow-down-outline"
            label="View open requests"
            onPress={() => router.push('/open-requests')}
            role="doctor"
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav role="doctor" />
    </View>
  );
}

const styles = StyleSheet.create({
  activityBorder: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  activityCopy: {
    flex: 1,
  },
  activityDetail: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  activityIcon: {
    alignItems: 'center',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.sm,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  activityItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  activityList: {
    paddingHorizontal: spacing.md,
  },
  activityTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '600',
  },
  availability: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  availabilityCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  availableDescription: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  availableIcon: {
    alignItems: 'center',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  availableTitle: {
    color: colors.doctor.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.doctor.softStrong,
    borderRadius: radius.pill,
    height: 45,
    justifyContent: 'center',
    width: 45,
  },
  bell: {
    padding: 7,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  greeting: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  link: {
    color: colors.doctor.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  noActivity: {
    paddingVertical: spacing.lg,
  },
  noActivityText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
  name: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  safeArea: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  specialty: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  verifiedCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  verifiedText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
