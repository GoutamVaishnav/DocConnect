import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { ConsultationHeader } from '@/components/consultation-header';
import { useConsultationDraft } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ReviewConsultationScreen() {
  const { draft, submitDraft } = useConsultationDraft();
  const [hasConsent, setHasConsent] = useState(false);

  function submitRequest() {
    if (!hasConsent) {
      Alert.alert('Consent required', 'Please confirm consent before submitting your consultation request.');
      return;
    }

    const consultation = submitDraft();
    router.replace({
      pathname: '/consultation-submitted',
      params: { consultationId: consultation.id },
    });
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ConsultationHeader step={3} title="Review & Submit" />

          <View style={styles.heading}>
            <Text style={typography.screenTitle}>Review Your Request</Text>
            <Text style={styles.description}>Check the information before you send it to a doctor.</Text>
          </View>

          <AppCard>
            <View style={styles.cardContent}>
              <View style={styles.rowHeader}>
                <Text style={styles.cardTitle}>Problem Description</Text>
                <Pressable accessibilityRole="button" onPress={() => router.back()}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
              </View>
              <Text style={styles.symptoms}>{draft.symptoms || 'No symptoms provided yet.'}</Text>
              <View style={styles.durationRow}>
                <MaterialCommunityIcons color={colors.patient.primary} name="clock-outline" size={17} />
                <Text style={styles.durationText}>{draft.duration ?? 'Duration not selected'}</Text>
              </View>
            </View>
          </AppCard>

          <AppCard>
            <View style={styles.cardContent}>
              <View style={styles.rowHeader}>
                <Text style={styles.cardTitle}>Photos</Text>
                <Pressable accessibilityRole="button" onPress={() => router.back()}>
                  <Text style={styles.edit}>Edit</Text>
                </Pressable>
              </View>
              {draft.photos.length > 0 ? (
                <View style={styles.photos}>
                  {draft.photos.map((photo) => (
                    <Image accessibilityLabel={photo.fileName} key={photo.id} source={{ uri: photo.uri }} style={styles.photo} />
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No photos added. Doctors can still review your written description.</Text>
              )}
            </View>
          </AppCard>

          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: hasConsent }} onPress={() => setHasConsent((current) => !current)} style={styles.consentRow}>
            <View style={[styles.checkbox, hasConsent && styles.checkboxChecked]}>
              {hasConsent ? <MaterialCommunityIcons color={colors.surface} name="check" size={15} /> : null}
            </View>
            <Text style={styles.consentText}>I agree to share this medical information with the doctor for consultation purposes.</Text>
          </Pressable>

          <View style={styles.demoNote}>
            <MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} />
            <Text style={styles.demoText}>Demo mode: this confirms the interface only. No medical data is sent to a server yet.</Text>
          </View>

          <AppButton label="Submit Request" onPress={submitRequest} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
  },
  checkbox: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 5,
    borderWidth: 1.5,
    height: 21,
    justifyContent: 'center',
    marginTop: 1,
    width: 21,
  },
  checkboxChecked: {
    backgroundColor: colors.patient.primary,
    borderColor: colors.patient.primary,
  },
  consentRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  consentText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  demoNote: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  demoText: {
    color: colors.text,
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  durationRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  durationText: {
    color: colors.patient.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  edit: {
    color: colors.patient.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
  heading: {
    marginBottom: spacing.lg,
    marginTop: spacing.xxl,
  },
  photo: {
    borderRadius: radius.sm,
    height: 76,
    width: 76,
  },
  photos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  rowHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  safeArea: {
    flex: 1,
  },
  symptoms: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
});
