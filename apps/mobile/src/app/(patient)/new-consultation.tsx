import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AppButton } from '@/components/app-button';
import { ConsultationHeader } from '@/components/consultation-header';
import { useConsultationDraft, type ConsultationDuration } from '@/context/consultation-draft';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const durationOptions: ConsultationDuration[] = ['Today', '1–3 days', 'About a week', 'More than a week'];

export default function NewConsultationScreen() {
  const { draft, updateDetails } = useConsultationDraft();
  const [symptoms, setSymptoms] = useState(draft.symptoms);
  const [duration, setDuration] = useState<ConsultationDuration | null>(draft.duration);

  function continueToPhotos() {
    if (symptoms.trim().length < 10 || !duration) {
      Alert.alert('Add your details', 'Describe your symptoms in at least 10 characters and choose how long you have had them.');
      return;
    }

    updateDetails({ duration, symptoms: symptoms.trim() });
    router.push('/consultation-photos');
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <ConsultationHeader step={1} title="New Consultation" />

          <View style={styles.heading}>
            <Text style={typography.screenTitle}>Describe Your Problem</Text>
            <Text style={styles.description}>Share enough detail to help the doctor understand what you are experiencing.</Text>
          </View>

          <Text style={styles.label}>What symptoms are you experiencing?</Text>
          <TextInput
            accessibilityLabel="Symptoms"
            autoCapitalize="sentences"
            multiline
            onChangeText={setSymptoms}
            placeholder="For example: redness, itching, rash, pain..."
            placeholderTextColor={colors.muted}
            style={styles.textArea}
            textAlignVertical="top"
            value={symptoms}
          />

          <Text style={styles.label}>How long have you had this?</Text>
          <View style={styles.durationGrid}>
            {durationOptions.map((option) => {
              const selected = duration === option;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option}
                  onPress={() => setDuration(option)}
                  style={[styles.durationOption, selected && styles.durationOptionSelected]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.durationText, selected && styles.durationTextSelected]}>{option}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>Your consultation is reviewed only by the doctor assigned to your request.</Text>
          </View>

          <AppButton label="Next" onPress={continueToPhotos} />
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.canvas,
    flex: 1,
  },
  content: {
    flexGrow: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.xs,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  durationOption: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    width: '47%',
  },
  durationOptionSelected: {
    backgroundColor: colors.patient.soft,
    borderColor: colors.patient.primary,
  },
  durationText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  durationTextSelected: {
    color: colors.patient.primaryDark,
  },
  heading: {
    marginBottom: spacing.lg,
    marginTop: spacing.xxl,
  },
  infoBox: {
    backgroundColor: colors.patient.soft,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  infoText: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 99,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  radioDot: {
    backgroundColor: colors.surface,
    borderRadius: 99,
    height: 6,
    width: 6,
  },
  radioSelected: {
    backgroundColor: colors.patient.primary,
    borderColor: colors.patient.primary,
  },
  safeArea: {
    flex: 1,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.navy,
    fontSize: 14,
    height: 142,
    lineHeight: 20,
    marginTop: spacing.xs,
    padding: spacing.md,
  },
});
