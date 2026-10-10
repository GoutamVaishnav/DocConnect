import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { BrandMark } from '@/components/brand-mark';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <Pressable onPress={() => router.replace('/onboarding')} style={styles.content}>
          <View style={styles.brandGroup}>
            <BrandMark size={104} />
            <Text style={styles.title}>DocConnect</Text>
            <Text style={styles.tagline}>Your Health, Our Priority</Text>
            <Text style={styles.description}>Connect · Consult · Heal</Text>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
          <AppButton label="Get started" onPress={() => router.replace('/onboarding')} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.patient.primary,
    width: 17,
  },
  brandGroup: {
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  description: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 10,
    height: 6,
    width: 6,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  footer: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  tagline: {
    color: colors.text,
    fontSize: 16,
    marginTop: 8,
  },
  title: {
    color: colors.patient.primary,
    fontSize: 31,
    fontWeight: '700',
    marginTop: spacing.md,
  },
});
