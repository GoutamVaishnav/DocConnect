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

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  async function createAccount() {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = fullName.trim();

    if (!normalizedName || !isValidEmail(normalizedEmail)) {
      Alert.alert('Missing details', 'Enter your full name and a valid email address.');
      return;
    }

    try {
      setIsSending(true);
      const response = await authApi.requestEmailOtp(normalizedEmail, 'PATIENT');

      router.push({
        pathname: '/verify-otp',
        params: {
          email: response.email,
          fullName: normalizedName,
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
          <Text style={styles.accountText}>Already have an account?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.replace('/patient-login')}>
            <Text style={styles.accountLink}> Login</Text>
          </Pressable>
        </View>
      }
      subtitle="Create your account with your name and email."
      title="Register"
    >
      <FormField
        accessibilityLabel="Full name"
        autoCapitalize="words"
        icon="account-outline"
        onChangeText={setFullName}
        placeholder="Full Name"
        value={fullName}
      />
      <FormField
        accessibilityLabel="Email address"
        autoCapitalize="none"
        autoCorrect={false}
        icon="email-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        onSubmitEditing={() => void createAccount()}
        placeholder="Email Address"
        returnKeyType="go"
        value={email}
      />
      <AppButton label="Send OTP to Email" loading={isSending} onPress={() => void createAccount()} />
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
});
