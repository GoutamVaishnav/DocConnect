import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { StatusBadge } from '@/components/status-badge';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function PatientHomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>RS</Text>
            </View>
            <View style={styles.greeting}>
              <Text style={styles.hello}>Hello, Rohan</Text>
              <Text style={styles.subGreeting}>How can we help you today?</Text>
            </View>
            <Pressable
              accessibilityLabel="Notifications"
              onPress={() => router.push('/patient-notifications')}
              style={styles.bell}
            >
              <MaterialCommunityIcons color={colors.navy} name="bell-outline" size={23} />
            </Pressable>
          </View>

          <View style={styles.adviceCard}>
            <View style={styles.adviceIcon}>
              <MaterialCommunityIcons color={colors.surface} name="stethoscope" size={28} />
            </View>
            <View style={styles.adviceCopy}>
              <Text style={styles.adviceTitle}>Get Medical Advice</Text>
              <Text style={styles.adviceDescription}>Consult with a doctor now</Text>
            </View>
            <Pressable
              accessibilityLabel="Start a consultation"
              onPress={() => router.push('/new-consultation')}
            >
              <MaterialCommunityIcons color={colors.surface} name="arrow-right" size={26} />
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={typography.sectionTitle}>Your Consultations</Text>
            <Pressable onPress={() => router.push('/consultations')}>
              <Text style={styles.link}>View all</Text>
            </Pressable>
          </View>

          <AppCard>
            <Pressable
              onPress={() => router.push('/consultations/skin-rash')}
              style={styles.consultationCard}
            >
              <View style={styles.caseImage}>
                <MaterialCommunityIcons color={colors.patient.primary} name="image-outline" size={25} />
              </View>
              <View style={styles.caseCopy}>
                <Text style={styles.caseTitle}>Skin Rash</Text>
                <Text style={styles.caseDoctor}>Dr. Mehta</Text>
                <Text style={styles.caseTime}>2 days ago</Text>
              </View>
              <View style={styles.caseMeta}>
                <StatusBadge status="In Progress" />
                <MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} />
              </View>
            </Pressable>
          </AppCard>

          <View style={styles.sectionHeader}>
            <Text style={typography.sectionTitle}>Recent Messages</Text>
          </View>

          <AppCard>
            <Pressable
              onPress={() => router.push('/messages')}
              style={styles.messageCard}
            >
              <View style={styles.messageAvatar}>
                <MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={23} />
              </View>
              <View style={styles.caseCopy}>
                <Text style={styles.caseTitle}>Dr. Sharma</Text>
                <Text numberOfLines={1} style={styles.messagePreview}>
                  New message about your consultation
                </Text>
              </View>
              <Text style={styles.messageTime}>1h ago</Text>
            </Pressable>
          </AppCard>

          <View style={styles.helpCard}>
            <MaterialCommunityIcons color={colors.patient.primary} name="shield-check-outline" size={21} />
            <Text style={styles.helpText}>Your medical information is private and shared only with your care team.</Text>
          </View>

          <AppButton
            icon="plus"
            label="Start a consultation"
            onPress={() => router.push('/new-consultation')}
          />
        </ScrollView>
      </SafeAreaView>
      <BottomNav role="patient" />
    </View>
  );
}

const styles = StyleSheet.create({
  adviceCard: {
    alignItems: 'center',
    backgroundColor: colors.patient.primary,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.lg,
  },
  adviceCopy: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  adviceDescription: {
    color: '#DCEEFF',
    fontSize: 12,
    marginTop: 3,
  },
  adviceIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  adviceTitle: {
    color: colors.surface,
    fontSize: 17,
    fontWeight: '700',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.patient.softStrong,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  avatarText: {
    color: colors.patient.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  bell: {
    padding: 7,
  },
  caseCopy: {
    flex: 1,
  },
  caseDoctor: {
    color: colors.text,
    fontSize: 12,
    marginTop: 2,
  },
  caseImage: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.sm,
    height: 55,
    justifyContent: 'center',
    width: 55,
  },
  caseMeta: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  caseTime: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 5,
  },
  caseTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  consultationCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: spacing.sm,
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
  },
  hello: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '700',
  },
  helpCard: {
    alignItems: 'flex-start',
    backgroundColor: colors.patient.soft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.sm,
  },
  helpText: {
    color: colors.text,
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  link: {
    color: colors.patient.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  messageAvatar: {
    alignItems: 'center',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  messageCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  messagePreview: {
    color: colors.text,
    fontSize: 12,
    marginTop: 3,
  },
  messageTime: {
    color: colors.muted,
    fontSize: 10,
  },
  safeArea: {
    flex: 1,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  subGreeting: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
});
