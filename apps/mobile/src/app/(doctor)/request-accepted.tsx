import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function RequestAcceptedScreen() {
  const { requestId } = useLocalSearchParams<{ requestId?: string }>();
  const { getRequest } = useDoctorRequests();
  const request = requestId ? getRequest(requestId) : undefined;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.illustration}>
            <View style={styles.clipboard}>
              <MaterialCommunityIcons color={colors.doctor.primary} name="clipboard-check-outline" size={68} />
            </View>
            <View style={styles.checkCircle}>
              <MaterialCommunityIcons color={colors.surface} name="check" size={28} />
            </View>
          </View>

          <Text style={styles.title}>Request Accepted!</Text>
          <Text style={styles.description}>
            {request ? `${request.patientLabel}'s ${request.concern.toLowerCase()} request was added to your local case list.` : 'The request was added to your local case list.'}
          </Text>

          <View style={styles.note}>
            <MaterialCommunityIcons color={colors.warning} name="information-outline" size={21} />
            <Text style={styles.noteText}>This only updates the on-device demo state. It does not contact a patient or create a real consultation.</Text>
          </View>
        </View>

        <View style={styles.footer}>
          {requestId ? (
            <AppButton
              label="View Case"
              onPress={() => router.replace({ pathname: '/cases/[caseId]', params: { caseId: requestId } })}
              role="doctor"
              variant="outline"
            />
          ) : null}
          <AppButton
            icon="message-text-outline"
            label="Go to Chat"
            onPress={() => {
              if (request) {
                router.replace({ pathname: '/chat/[conversationId]', params: { conversationId: `doctor-${request.id}`, role: 'doctor' } });
                return;
              }

              router.replace('/my-cases');
            }}
            role="doctor"
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  checkCircle: { alignItems: 'center', backgroundColor: colors.success, borderColor: colors.surface, borderRadius: radius.pill, borderWidth: 4, bottom: 6, height: 50, justifyContent: 'center', position: 'absolute', right: 2, width: 50 },
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
