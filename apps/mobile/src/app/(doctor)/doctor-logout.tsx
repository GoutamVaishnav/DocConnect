import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { useAuth } from '@/context/auth';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function DoctorLogoutScreen() {
  const { signOut } = useAuth();

  async function logout() {
    await signOut();
    router.replace('/choose-role');
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.icon}>
            <MaterialCommunityIcons color="#D93B3B" name="logout" size={44} />
          </View>
          <Text style={styles.title}>Log out?</Text>
          <Text style={styles.description}>
            Your saved session will be removed from this device.
          </Text>
        </View>
        <View style={styles.footer}>
          <AppButton label="Logout" onPress={() => void logout()} role="doctor" />
          <AppButton label="Cancel" onPress={() => goBackOr('/doctor-profile')} role="doctor" variant="ghost" />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  description: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 290, textAlign: 'center' },
  footer: { gap: spacing.sm, padding: spacing.xl },
  icon: { alignItems: 'center', backgroundColor: '#FFF0F0', borderRadius: radius.pill, height: 104, justifyContent: 'center', marginBottom: spacing.xl, width: 104 },
  safeArea: { flex: 1 },
  title: { color: colors.navy, fontSize: 24, fontWeight: '700' },
});
