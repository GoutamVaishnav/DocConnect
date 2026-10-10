import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.hero}>
          <View style={styles.illustration}>
            <View style={styles.personCircle}>
              <MaterialCommunityIcons color={colors.patient.primary} name="doctor" size={74} />
            </View>
            <View style={styles.messageBubble}>
              <MaterialCommunityIcons color={colors.surface} name="message-text" size={24} />
            </View>
            <View style={styles.heartBubble}>
              <MaterialCommunityIcons color={colors.doctor.primary} name="heart-pulse" size={27} />
            </View>
          </View>

          <Text style={styles.title}>Get Expert Medical Advice</Text>
          <Text style={styles.description}>
            Consult with verified doctors from the comfort of your home.
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.dots}>
            <View style={styles.dot} />
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
          </View>
          <AppButton label="Next" onPress={() => router.push('/choose-role')} />
          <AppButton label="Skip" onPress={() => router.replace('/choose-role')} variant="ghost" />
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
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  description: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
    maxWidth: 295,
    textAlign: 'center',
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
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  heartBubble: {
    alignItems: 'center',
    backgroundColor: colors.doctor.soft,
    borderRadius: radius.md,
    bottom: 19,
    height: 48,
    justifyContent: 'center',
    left: 21,
    position: 'absolute',
    transform: [{ rotate: '-9deg' }],
    width: 48,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: spacing.xxxl,
  },
  illustration: {
    alignItems: 'center',
    backgroundColor: colors.patient.soft,
    borderRadius: 120,
    height: 210,
    justifyContent: 'center',
    marginBottom: spacing.xxl,
    width: 210,
  },
  messageBubble: {
    alignItems: 'center',
    backgroundColor: colors.patient.primary,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    position: 'absolute',
    right: 19,
    top: 25,
    transform: [{ rotate: '8deg' }],
    width: 54,
  },
  personCircle: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 80,
    height: 152,
    justifyContent: 'center',
    width: 152,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  title: {
    color: colors.navy,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
});
