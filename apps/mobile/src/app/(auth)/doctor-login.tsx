import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AuthLayout } from '@/components/auth-layout';
import { FormField } from '@/components/form-field';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function DoctorLoginScreen() {
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [passwordHidden, setPasswordHidden] = useState(true);

  function signIn() {
    if (!contact.trim() || !password) {
      Alert.alert('Missing details', 'Enter your professional email or phone number and password.');
      return;
    }

    router.replace('/dashboard');
  }

  return (
    <AuthLayout
      footer={
        <View style={styles.verificationNote}>
          <Text style={styles.verificationTitle}>New to DocConnect?</Text>
          <Text style={styles.verificationText}>
            Doctor registration and professional verification will be available in a later phase.
          </Text>
        </View>
      }
      role="doctor"
      subtitle="Sign in to manage your patient consultations."
      title="Doctor Login"
    >
      <FormField
        accessibilityLabel="Professional email or phone"
        icon="account-outline"
        keyboardType="email-address"
        onChangeText={setContact}
        placeholder="Professional Email or Phone"
        value={contact}
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
      <AppButton label="Login" onPress={signIn} role="doctor" />
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
