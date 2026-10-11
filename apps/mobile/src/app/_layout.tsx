import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { AuthProvider, useAuth } from '@/context/auth';
import { ConsultationDraftProvider } from '@/context/consultation-draft';
import { DoctorRequestsProvider } from '@/context/doctor-requests';
import { DoctorProfileProvider } from '@/context/doctor-profile';
import { PatientProfileProvider } from '@/context/patient-profile';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <DoctorProfileProvider>
        <PatientProfileProvider>
          <ConsultationDraftProvider>
            <DoctorRequestsProvider>
              <RootNavigator />
            </DoctorRequestsProvider>
          </ConsultationDraftProvider>
        </PatientProfileProvider>
      </DoctorProfileProvider>
    </AuthProvider>
  );
}

function RootNavigator() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={colors.patient.primary} size="large" />
      </View>
    );
  }

  const role = session?.user.role;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'PATIENT'}>
        <Stack.Screen name="(patient)" />
      </Stack.Protected>
      <Stack.Protected guard={role === 'DOCTOR'}>
        <Stack.Screen name="(doctor)" />
      </Stack.Protected>
      <Stack.Protected guard={Boolean(session)}>
        <Stack.Screen name="chat" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    alignItems: 'center',
    backgroundColor: colors.canvas,
    flex: 1,
    justifyContent: 'center',
  },
});
