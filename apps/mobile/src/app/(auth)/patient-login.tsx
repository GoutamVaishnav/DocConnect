import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function PatientLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);

  function signIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing details', 'Enter your email address and password to continue.');
      return;
    }

    router.replace('/home');
  }

  return (
    <AuthLayout
      footer={
        <View style={styles.accountPrompt}>
          <Text style={styles.accountText}>Don&apos;t have an account?</Text>
          <Pressable accessibilityRole="link" onPress={() => router.push('/register')}>
            <Text style={styles.accountLink}> Register</Text>
          </Pressable>
        </View>
      }
      subtitle="Welcome back! Please log in to your account."
      title="Login"
    >
      <FormField
        accessibilityLabel="Email address"
        icon="account-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email Address"
        value={email}
      />
      <FormField
        accessibilityLabel="Password"
        icon="lock-outline"
        onChangeText={setPassword}
        onSubmitEditing={signIn}
        placeholder="Password"
        returnKeyType="go"
        secureTextEntry={passwordHidden}
        toggleSecureEntry={() => setPasswordHidden((current) => !current)}
        value={password}
      />
      <Pressable accessibilityRole="link" onPress={() => Alert.alert('Forgot password', 'Password reset will be connected when authentication APIs are added.')}>
        <Text style={styles.forgotPassword}>Forgot Password?</Text>
      </Pressable>

      <AppButton label="Login" onPress={signIn} />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.orText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <AppButton
        icon="google"
        label="Continue with Google"
        onPress={() => Alert.alert('Google sign-in', 'Google sign-in will be added with the real authentication flow.')}
        variant="outline"
      />
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
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    color: colors.patient.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: -spacing.xs,
  },
  orText: {
    color: colors.muted,
    fontSize: 12,
  },
});
