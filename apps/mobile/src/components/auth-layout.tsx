import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand-mark';
import { colors, type AppRole, roleColors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type AuthLayoutProps = {
  children: ReactNode;
  footer?: ReactNode;
  role?: AppRole;
  subtitle: string;
  title: string;
};

export function AuthLayout({ children, footer, role = 'patient', subtitle, title }: AuthLayoutProps) {
  const theme = roleColors(role);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} />
          </Pressable>

          <View style={styles.branding}>
            <BrandMark role={role} size={56} />
            <Text style={[styles.brandName, { color: theme.primary }]}>DocConnect</Text>
          </View>

          <View style={styles.heading}>
            <Text style={typography.screenTitle}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>

          <View style={styles.form}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    padding: spacing.xs,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  branding: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  form: {
    gap: spacing.md,
  },
  heading: {
    marginBottom: spacing.xl,
    marginTop: spacing.xxl,
  },
  safeArea: {
    flex: 1,
  },
  subtitle: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
});
