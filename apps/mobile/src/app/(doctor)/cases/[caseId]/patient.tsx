import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function InformationCard({ icon, label, value }: { icon: 'account-outline' | 'phone-outline' | 'clipboard-text-outline' | 'alert-circle-outline'; label: string; value: string }) {
  return (
    <AppCard>
      <View style={styles.infoCard}>
        <View style={styles.iconBox}><MaterialCommunityIcons color={colors.doctor.primary} name={icon} size={21} /></View>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{value}</Text>
        </View>
      </View>
    </AppCard>
  );
}

export default function PatientInformationScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { getRequest } = useDoctorRequests();
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;

  if (!caseItem || caseItem.status === 'Open') {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>Patient information is unavailable.</Text><AppButton label="Back to cases" onPress={() => router.replace('/my-cases')} role="doctor" /></SafeAreaView></View>;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable>
          <Text style={styles.topTitle}>Patient Information</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.profile}>
            <View style={styles.avatar}><MaterialCommunityIcons color={colors.doctor.primary} name="account-outline" size={38} /></View>
            <Text style={typography.sectionTitle}>{caseItem.patientLabel}</Text>
            <Text style={styles.profileMeta}>{`${caseItem.age} years • Local demo profile`}</Text>
          </View>

          <InformationCard icon="account-outline" label="Profile" value="Identity details are not connected in this UI demo." />
          <InformationCard icon="phone-outline" label="Contact" value="Contact sharing is not available until secure backend access is added." />
          <InformationCard icon="clipboard-text-outline" label="Medical History" value="No medical history is available in this sample profile." />
          <InformationCard icon="alert-circle-outline" label="Allergies" value="No allergy information is available in this sample profile." />

          <View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Patient records must be retrieved from an authenticated backend in the production app.</Text></View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.doctor.softStrong, borderRadius: radius.pill, height: 82, justifyContent: 'center', width: 82 },
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl },
  copy: { flex: 1 },
  iconBox: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.sm, height: 42, justifyContent: 'center', width: 42 },
  infoCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  label: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.md, padding: spacing.md },
  noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  notFoundText: { color: colors.text, fontSize: 14 },
  profile: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  profileMeta: { color: colors.muted, fontSize: 12 },
  safeArea: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
  value: { color: colors.text, fontSize: 12, lineHeight: 18, marginTop: 3 },
});
