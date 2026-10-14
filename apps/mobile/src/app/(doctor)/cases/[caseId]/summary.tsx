import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { useDoctorRequests } from '@/context/doctor-requests';
import { getApiErrorMessage } from '@/lib/api';
import { goBackOr } from '@/lib/navigation';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function ConsultationSummaryScreen() {
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const { completeCase, getRequest, loadRequest } = useDoctorRequests();
  const caseItem = typeof caseId === 'string' ? getRequest(caseId) : undefined;
  const [notes, setNotes] = useState(caseItem?.doctorNotes ?? '');
  const [instructions, setInstructions] = useState(caseItem?.careInstructions ?? '');
  const [prescriptionUrl, setPrescriptionUrl] = useState(caseItem?.prescriptionUrl ?? '');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!caseId) return;
    void (async () => {
      try {
        setIsLoading(true);
        const record = await loadRequest(caseId);
        if (!cancelled) {
          setNotes((current) => current || record.doctorNotes || '');
          setInstructions((current) => current || record.careInstructions || '');
          setPrescriptionUrl((current) => current || record.prescriptionUrl || '');
        }
      } catch (error) {
        if (!cancelled) setScreenError(getApiErrorMessage(error));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId, loadRequest]);

  async function completeConsultation() {
    if (!caseItem) return;
    const doctorNotes = notes.trim();
    if (doctorNotes.length < 10) {
      Alert.alert('Add doctor notes', 'Doctor notes must contain at least 10 characters before completing the consultation.');
      return;
    }
    try {
      setIsSaving(true);
      const completed = await completeCase(caseItem.id, {
        ...(instructions.trim() ? { careInstructions: instructions.trim() } : {}),
        doctorNotes,
        ...(prescriptionUrl.trim() ? { prescriptionUrl: prescriptionUrl.trim() } : {}),
      });
      router.replace({ pathname: '/consultation-completed', params: { caseId: completed.id } });
    } catch (error) {
      Alert.alert('Could not complete consultation', getApiErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  if (!caseItem && isLoading) return <View style={styles.container}><SafeAreaView style={styles.notFound}><ActivityIndicator color={colors.doctor.primary} size="large" /><Text style={styles.notFoundText}>Loading consultation…</Text></SafeAreaView></View>;
  if (!caseItem || caseItem.status === 'Open') return <View style={styles.container}><SafeAreaView style={styles.notFound}><Text style={styles.notFoundText}>{screenError ?? 'Summary is unavailable for this request.'}</Text><AppButton label="Back to cases" onPress={() => router.replace('/my-cases')} role="doctor" /></SafeAreaView></View>;

  const completed = caseItem.status === 'Completed';
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><View style={styles.topBar}><Pressable accessibilityLabel="Go back" hitSlop={10} onPress={() => goBackOr({ pathname: '/cases/[caseId]', params: { caseId: caseItem.id } })} style={styles.backButton}><MaterialCommunityIcons color={colors.navy} name="arrow-left" size={24} /></Pressable><Text style={styles.topTitle}>Consultation Summary</Text><View style={styles.backButton} /></View><ScrollView contentContainerStyle={styles.content} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}><Text style={typography.sectionTitle}>{caseItem.patientLabel}</Text><Text style={styles.subtitle}>{caseItem.concern}</Text><AppCard><View style={styles.formCard}><Text style={styles.fieldLabel}>Doctor’s Notes</Text><TextInput editable={!completed && !isSaving} multiline onChangeText={setNotes} placeholder="Add clinical notes for the patient…" placeholderTextColor={colors.muted} style={styles.textArea} value={notes} /></View></AppCard><AppCard><View style={styles.formCard}><Text style={styles.fieldLabel}>Care Instructions</Text><TextInput editable={!completed && !isSaving} multiline onChangeText={setInstructions} placeholder="Add care instructions (optional)…" placeholderTextColor={colors.muted} style={styles.textArea} value={instructions} /></View></AppCard><AppCard><View style={styles.formCard}><View style={styles.prescriptionHeading}><MaterialCommunityIcons color={colors.doctor.primary} name="file-document-outline" size={21} /><Text style={styles.fieldLabel}>Prescription link</Text></View><TextInput autoCapitalize="none" editable={!completed && !isSaving} keyboardType="url" onChangeText={setPrescriptionUrl} placeholder="https://… (optional)" placeholderTextColor={colors.muted} style={styles.singleInput} value={prescriptionUrl} /><Text style={styles.helper}>Paste a secure HTTP(S) prescription URL if one already exists. File upload is not part of this endpoint.</Text></View></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={20} /><Text style={styles.noteText}>{completed ? 'This completed summary is stored with the consultation and is available to the patient.' : 'Complete the consultation to securely save these notes and share the summary with the patient.'}</Text></View></ScrollView><View style={styles.footer}>{completed ? <AppButton label="Back to My Cases" onPress={() => router.replace('/my-cases')} role="doctor" /> : <AppButton label="Mark as Complete" icon="check-circle-outline" loading={isSaving} onPress={() => void completeConsultation()} role="doctor" />}</View></SafeAreaView></KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  backButton: { alignItems: 'center', height: 32, justifyContent: 'center', width: 32 }, container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl }, fieldLabel: { color: colors.navy, fontSize: 14, fontWeight: '700' }, footer: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.sm, padding: spacing.md }, formCard: { padding: spacing.md }, helper: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing.xs }, note: { alignItems: 'flex-start', backgroundColor: colors.doctor.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, notFound: { alignItems: 'center', flex: 1, gap: spacing.md, justifyContent: 'center', padding: spacing.xl }, notFoundText: { color: colors.text, fontSize: 14, textAlign: 'center' }, prescriptionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs }, safeArea: { flex: 1 }, singleInput: { borderBottomColor: colors.border, borderBottomWidth: 1, color: colors.navy, fontSize: 13, marginTop: spacing.sm, minHeight: 42, paddingVertical: spacing.xs }, subtitle: { color: colors.text, fontSize: 13, marginTop: -spacing.sm }, textArea: { borderColor: colors.border, borderRadius: radius.sm, borderWidth: 1, color: colors.navy, fontSize: 13, lineHeight: 20, marginTop: spacing.sm, minHeight: 96, padding: spacing.sm, textAlignVertical: 'top' }, topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs }, topTitle: { color: colors.navy, fontSize: 16, fontWeight: '700' },
});
