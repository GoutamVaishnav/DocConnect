import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import type { AppRole } from '@/theme/colors';
import { goBackOr } from '@/lib/navigation';
import { spacing } from '@/theme/spacing';

type ScreenHeaderProps = { fallback?: Href; role?: AppRole; title: string };

export function ScreenHeader({ fallback, role = 'patient', title }: ScreenHeaderProps) {
  const defaultFallback = role === 'doctor' ? '/dashboard' : '/home';

  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr(fallback ?? defaultFallback)} style={styles.backButton}>
        <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  title: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
