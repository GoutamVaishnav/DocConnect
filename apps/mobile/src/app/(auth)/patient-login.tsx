import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { colors } from '@/theme/colors';

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function PatientLoginScreen() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function requestOtp() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Enter a valid email', 'Use the email address where you want to receive the OTP.');
      return;
    }

    try {
      setIsSending(true);
      const response = await authApi.requestEmailOtp(normalizedEmail, 'PATIENT');

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
        <View style={styles.accountPrompt}>
          <Text style={styles.accountText}>New to DocConnect?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/register')}>
            <Text style={styles.accountLink}> Register</Text>
          </Pressable>
        </View>
      }
      subtitle="Enter your email and we will send a secure one-time code."
      title="Patient Login"
    >
      <FormField
        accessibilityLabel="Email address"
        autoCapitalize="none"
        autoCorrect={false}
        icon="email-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        onSubmitEditing={() => void requestOtp()}
        placeholder="Email Address"
        returnKeyType="go"
        value={email}
      />
      <AppButton label="Send OTP to Email" loading={isSending} onPress={() => void requestOtp()} />
      <Text style={styles.note}>We never ask for a password. The OTP is valid for 10 minutes.</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  accountLink: {
    color: colors.patient.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  accountPrompt: {
    flexDirection: 'row',
  },
  accountText: {
    color: colors.text,
    fontSize: 13,
  },
  note: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
