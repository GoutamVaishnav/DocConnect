import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors } from '@/theme/colors';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);

  function createAccount() {
    if (!fullName.trim() || !email.trim() || !password) {
      Alert.alert('Missing details', 'Complete all fields to create your account.');
      return;
    }

    router.push({ pathname: '/verify-otp', params: { email: email.trim() } });
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
      subtitle="Create your account to get started."
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
        icon="email-outline"
        keyboardType="email-address"
        onChangeText={setEmail}
        placeholder="Email Address"
        value={email}
      />
      <FormField
        accessibilityLabel="Password"
        icon="lock-outline"
        onChangeText={setPassword}
        onSubmitEditing={createAccount}
        placeholder="Password"
        returnKeyType="go"
        secureTextEntry={passwordHidden}
        toggleSecureEntry={() => setPasswordHidden((current) => !current)}
        value={password}
      />
      <AppButton label="Register" onPress={createAccount} />
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
