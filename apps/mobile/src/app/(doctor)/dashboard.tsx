import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { MetricCard } from '@/components/metric-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const activity = [
  { detail: '2 mins ago', icon: 'inbox-arrow-down-outline', title: 'New request from Patient #1042' },
  { detail: '1 hour ago', icon: 'check-circle-outline', title: 'Consultation completed' },
  { detail: '2 hours ago', icon: 'message-text-outline', title: 'New message from Patient #987' },
] as const;

export default function DoctorDashboardScreen() {
  const [available, setAvailable] = useState(true);
  const { acceptedCases, completedCases, openRequests } = useDoctorRequests();

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
              <Text style={styles.name}>Dr. Sharma</Text>
              <Text style={styles.specialty}>General Physician</Text>
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
                    {available ? 'You can receive new requests' : 'New requests are paused'}
                  </Text>
                </View>
              </View>
              <Switch
                accessibilityLabel="Change availability"
                onValueChange={setAvailable}
                thumbColor={colors.surface}
                trackColor={{ false: colors.border, true: colors.doctor.primary }}
                value={available}
              />
            </View>
          </AppCard>

          <View style={styles.metrics}>
            <MetricCard label="New Requests" role="doctor" value={String(openRequests.length)} />
            <MetricCard label="Active Cases" role="doctor" value={String(3 + acceptedCases.length)} />
            <MetricCard label="Completed" role="doctor" value={String(12 + completedCases.length)} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={typography.sectionTitle}>Recent Activity</Text>
            <Pressable onPress={() => router.push('/doctor-notifications')}>
              <Text style={styles.link}>View all</Text>
            </Pressable>
          </View>

          <AppCard>
            <View style={styles.activityList}>
              {activity.map((item, index) => (
                <Pressable
                  key={item.title}
                  onPress={() => {
                    if (item.title === 'New request from Patient #1042') {
                      router.push('/open-requests');
                      return;
                    }

                    if (item.title === 'New message from Patient #987') {
                      router.push({ pathname: '/chat/[conversationId]', params: { conversationId: 'doctor-patient-0987', role: 'doctor' } });
                      return;
                    }

                    router.push('/my-cases');
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
              ))}
            </View>
          </AppCard>

          <View style={styles.verifiedCard}>
            <MaterialCommunityIcons color={colors.doctor.primary} name="check-decagram" size={22} />
            <Text style={styles.verifiedText}>Your professional profile is verified.</Text>
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
