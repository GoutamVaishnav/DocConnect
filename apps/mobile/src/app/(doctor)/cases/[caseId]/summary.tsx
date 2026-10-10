import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ConsultationSummaryScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { completeCase, getRequest, getSummary, saveSummary } = useDoctorRequests();
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;
  const savedSummary = caseItem ? getSummary(caseItem.id) : undefined;
  const [notes, setNotes] = useState(savedSummary?.notes ?? '');
  const [instructions, setInstructions] = useState(savedSummary?.instructions ?? '');
  const [prescriptionName, setPrescriptionName] = useState(savedSummary?.prescriptionName ?? '');

  function saveCurrentSummary() {
    if (!caseItem) {
      return;
    }

    saveSummary(caseItem.id, { instructions: instructions.trim(), notes: notes.trim(), prescriptionName: prescriptionName.trim() });
  }

  function completeConsultation() {
    if (!caseItem) {
      return;
    }

    saveCurrentSummary();
    const completedCase = completeCase(caseItem.id);

    if (completedCase) {
      router.replace({ pathname: '/consultation-completed', params: { caseId: completedCase.id } });
    }
  }

  if (!caseItem || caseItem.status === 'Open') {
    return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>Summary is unavailable for this request.</Text><AppButton label="Back to cases" onPress={() => router.replace('/my-cases')} role="doctor" /></SafeAreaView></View>;
  }

  const completed = caseItem.status === 'Completed';

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => router.back()} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable>
          <Text style={styles.topTitle}>Consultation Summary</Text>
          <View style={styles.backButton} />
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={typography.sectionTitle}>{caseItem.patientLabel}</Text>
          <Text style={styles.subtitle}>{caseItem.concern}</Text>

          <AppCard>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Doctor’s Notes</Text>
              <TextInput editable={!completed} multiline onChangeText={setNotes} placeholder="Add internal demo notes…" placeholderTextColor={colors.muted} style={styles.textArea} value={notes} />
            </View>
          </AppCard>
          <AppCard>
            <View style={styles.formCard}>
              <Text style={styles.fieldLabel}>Care Instructions</Text>
              <TextInput editable={!completed} multiline onChangeText={setInstructions} placeholder="Add demo care instructions…" placeholderTextColor={colors.muted} style={styles.textArea} value={instructions} />
            </View>
          </AppCard>
          <AppCard>
            <View style={styles.formCard}>
              <View style={styles.prescriptionHeading}><MaterialCommunityIcons color={colors.doctor.primary} name="file-document-outline" size={21} /><Text style={styles.fieldLabel}>Prescription Placeholder</Text></View>
              <TextInput editable={!completed} onChangeText={setPrescriptionName} placeholder="Prescription document name (optional)" placeholderTextColor={colors.muted} style={styles.singleInput} value={prescriptionName} />
              <Text style={styles.helper}>A real prescription file is not generated or shared in this UI demo.</Text>
            </View>
          </AppCard>

          <View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Use only sample content here. In production, clinical notes and prescriptions need authenticated storage and patient consent.</Text></View>
        </ScrollView>
        <View style={styles.footer}>
          {completed ? (
            <AppButton label="Back to My Cases" onPress={() => router.replace('/my-cases')} role="doctor" />
          ) : (
            <>
              <AppButton label="Save Summary" onPress={saveCurrentSummary} role="doctor" variant="outline" />
              <AppButton label="Mark as Complete" icon="check-circle-outline" onPress={completeConsultation} role="doctor" />
            </>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 },
  container: { backgroundColor: colors.canvas, flex: 1 },
  content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl },
  fieldLabel: { color: colors.navy, fontSize: 14, fontWeight: '700' },
  footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm, padding: spacing.md },
  formCard: { padding: spacing.md },
  helper: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.xs },
  note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md },
  noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 },
  notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl },
  notFoundText: { color: colors.text, fontSize: 14 },
  prescriptionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  safeArea: { flex: 1 },
  singleInput: { borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.navy, fontSize: 13, marginTop: spacing.sm, minHeight: 42, paddingVertical: spacing.xs },
  subtitle: { color: colors.text, fontSize: 13, marginTop: -spacing.sm },
  textArea: { borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.navy, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, minHeight: 96, padding: spacing.sm, textAlignVertical: 'top' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
  topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
