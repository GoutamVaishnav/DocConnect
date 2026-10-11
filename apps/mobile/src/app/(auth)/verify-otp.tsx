import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { useAuth } from '@/context/auth';
import { type AppUserRole, authApi, getApiErrorMessage, profileApi } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const otpLength = 6;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function readRole(value: string | undefined): AppUserRole | null {
  return value === 'PATIENT' || value === 'DOCTOR' ? value : null;
}

export default function VerifyOtpScreen() {
  const inputs = useRef<(TextInput | null)[]>([]);
  const { signIn } = useAuth();
  const [digits, setDigits] = useState(Array(otpLength).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const parameters = useLocalSearchParams<{
    developmentCode?: string | string[];
    email?: string | string[];
    fullName?: string | string[];
    role?: string | string[];
  }>();
  const email = firstValue(parameters.email)?.trim().toLowerCase() ?? '';
  const fullName = firstValue(parameters.fullName)?.trim() ?? '';
  const role = readRole(firstValue(parameters.role));
  const [developmentCode, setDevelopmentCode] = useState(firstValue(parameters.developmentCode) ?? '');
  const deliveryAddress = email || 'your email address';

  function updateDigit(value: string, index: number) {
    const enteredDigits = value.replace(/\D/g, '');
    const nextDigits = [...digits];

    if (enteredDigits.length > 1) {
      enteredDigits.slice(0, otpLength - index).split('').forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
      setDigits(nextDigits);
      inputs.current[Math.min(index + enteredDigits.length, otpLength - 1)]?.focus();
      return;
    }

    nextDigits[index] = enteredDigits;
    setDigits(nextDigits);

    if (enteredDigits && index < otpLength - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function verifyCode() {
    const code = digits.join('');

    if (!email || !role) {
      Alert.alert('Login details missing', 'Go back and request a new OTP before verifying.');
      return;
    }

    if (code.length !== otpLength) {
      Alert.alert('Enter the code', 'Please enter all 6 digits from the verification code.');
      return;
    }

    try {
      setIsVerifying(true);
      const response = await authApi.verifyEmailOtp(email, role, code);

      if (response.user.role === 'PATIENT' && fullName) {
        await profileApi.savePatientProfile(response.accessToken, fullName);
      }

      await signIn({ accessToken: response.accessToken, user: response.user });
      router.replace(response.user.role === 'DOCTOR' ? '/dashboard' : '/home');
    } catch (error) {
      Alert.alert('Verification failed', getApiErrorMessage(error));
    } finally {
      setIsVerifying(false);
    }
  }

  async function resendOtp() {
    if (!email || !role) {
      Alert.alert('Login details missing', 'Go back and request a new OTP.');
      return;
    }

    try {
      setIsResending(true);
      const response = await authApi.requestEmailOtp(email, role);
      setDigits(Array(otpLength).fill(''));
      setDevelopmentCode(response.developmentCode ?? '');
      inputs.current[0]?.focus();
      Alert.alert('OTP sent', `A new OTP was sent to ${response.email}.`);
    } catch (error) {
      Alert.alert('OTP could not be resent', getApiErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <Pressable accessibilityRole="link" disabled={isResending} onPress={() => void resendOtp()}>
          <Text style={[styles.resend, isResending ? styles.disabled : undefined]}>
            {isResending ? 'Sending OTP…' : 'Resend OTP to email'}
          </Text>
        </Pressable>
      }
      subtitle={`Enter the 6 digit code sent to ${deliveryAddress}.`}
      title="Verify OTP"
    >
      <View accessibilityLabel="Six digit verification code" style={styles.otpRow}>
        {digits.map((digit, index) => (
          <TextInput
            accessibilityLabel={`OTP digit ${index + 1}`}
            keyboardType="number-pad"
            key={index}
            maxLength={index === 0 ? otpLength : 1}
            onChangeText={(value) => updateDigit(value, index)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
            ref={(input) => {
              inputs.current[index] = input;
            }}
            selectTextOnFocus
            style={[styles.otpInput, digit ? styles.otpInputFilled : undefined]}
            value={digit}
          />
        ))}
      </View>
      <AppButton label="Verify & Continue" loading={isVerifying} onPress={() => void verifyCode()} />
      {developmentCode ? (
        <Text style={styles.developmentCode}>Development OTP: {developmentCode}</Text>
      ) : (
        <Text style={styles.note}>The code expires in 10 minutes.</Text>
      )}
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  developmentCode: {
    color: colors.doctor.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.55,
  },
  note: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
  otpInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 21,
    fontWeight: '700',
    height: 52,
    textAlign: 'center',
    width: 42,
  },
  otpInputFilled: {
    backgroundColor: colors.patient.soft,
    borderColor: colors.patient.primary,
  },
  otpRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  resend: {
    color: colors.patient.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
