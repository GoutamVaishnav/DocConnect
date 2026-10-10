import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const otpLength = 6;

export default function VerifyOtpScreen() {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [digits, setDigits] = useState(Array(otpLength).fill(''));
  const { email } = useLocalSearchParams<{ email?: string }>();
  const deliveryAddress = typeof email === 'string' && email ? email : 'your email address';

  function updateDigit(value: string, index: number) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < otpLength - 1) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  function verifyCode() {
    if (digits.join('').length !== otpLength) {
      Alert.alert('Enter the code', 'Please enter all 6 digits from the verification code.');
      return;
    }

    router.replace('/home');
  }

  return (
    <AuthLayout
      footer={
        <Pressable
          accessibilityRole="link"
          onPress={() => Alert.alert('Code resend', `A new OTP will be sent to ${deliveryAddress} when the authentication API is connected.`)}
        >
          <Text style={styles.resend}>Resend OTP to email in 00:30</Text>
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
            maxLength={1}
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
      <AppButton label="Verify & Continue" onPress={verifyCode} />
      <Text style={styles.note}>Demo mode: any six digits will complete the UI flow.</Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
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
    borderColor: colors.patient.primary,
    backgroundColor: colors.patient.soft,
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
