import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function DoctorLoginScreen() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function requestOtp() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Enter a valid email', 'Use your registered professional email address.');
      return;
    }

    try {
      setIsSending(true);
      const response = await authApi.requestEmailOtp(normalizedEmail, 'DOCTOR');

      router.push({
        pathname: '/verify-otp',
        params: {
          email: response.email,
          role: response.role,
          developmentCode: response.developmentCode ?? '',
        },
      });
    } catch (error) {
      Alert.alert('OTP could not be sent', getApiErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <View style={styles.verificationNote}>
          <Text style={styles.verificationTitle}>Doctor access</Text>
          <Text style={styles.verificationText}>
            Sign in with the professional email registered for your doctor account.
          </Text>
        </View>
      }
      role="doctor"
      subtitle="Enter your professional email and receive a secure one-time code."
      title="Doctor Login"
    >
      <FormField
        accessibilityLabel="Professional email"
        autoCapitalize="none"
        autoCorrect={false}
        icon="email-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        onSubmitEditing={() => void requestOtp()}
        placeholder="Professional Email"
        returnKeyType="go"
        value={email}
      />
      <AppButton label="Send OTP to Email" loading={isSending} onPress={() => void requestOtp()} role="doctor" />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  verificationNote: {
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.md,
    gap: spacing.xxs,
    padding: spacing.md,
  },
  verificationText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  verificationTitle: {
    color: colors.doctor.primaryDark,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
