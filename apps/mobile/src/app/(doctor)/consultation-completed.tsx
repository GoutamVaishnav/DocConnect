import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function ConsultationCompletedScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { getRequest } = useDoctorRequests();
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.illustration}><View style={styles.clipboard}><MaterialCommunityIcons color={colors.doctor.primary} name="clipboard-check-outline" size={68} /></View><View style={styles.check}><MaterialCommunityIcons color={colors.surface} name="check" size={28} /></View></View>
          <Text style={styles.title}>Consultation Completed!</Text>
          <Text style={styles.description}>{caseItem ? `${caseItem.patientLabel}'s sample case was moved to the local completed list.` : 'The sample case was moved to the local completed list.'}</Text>
          <View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={21} /><Text style={styles.noteText}>This does not notify a patient, issue a prescription, or create a real medical record.</Text></View>
        </View>
        <View style={styles.footer}>
          {caseId ? <AppButton label="View Summary" onPress={() => router.replace({ pathname: '/cases/[caseId]/summary', params: { caseId } })} role="doctor" variant="outline" /> : null}
          <AppButton label="Go to My Cases" onPress={() => router.replace('/my-cases')} role="doctor" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  check: { alignItems: 'center', backgroundColor: colors.success, borderColor: colors.surface, borderRadius: radius.pill, borderWidth: 4, bottom: 6, height: 50, justifyContent: 'center', position: 'absolute', right: 2, width: 50 },
  clipboard: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.xl, height: 140, justifyContent: 'center', width: 140 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  description: { color: colors.text, fontSize: 15, lineHeight: 23, marginTop: spacing.sm, maxWidth: 300, textAlign: 'center' },
  footer: { gap: spacing.sm, padding: spacing.xl, paddingTop: spacing.sm },
  illustration: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 188, justifyContent: 'center', marginBottom: spacing.xxl, width: 188 },
  note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xxl, padding: spacing.md },
  noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  safeArea: { flex: 1 },
  title: { color: colors.navy, fontSize: 25, fontWeight: '700' },
});
