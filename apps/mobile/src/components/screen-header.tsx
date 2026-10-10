import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type ScreenHeaderProps = { title: string };

export function ScreenHeader({ title }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}>
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
