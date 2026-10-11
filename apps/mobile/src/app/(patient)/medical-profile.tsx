import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { SettingsRow } from '@/components/settings-row';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export default function MedicalProfileScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Medical Profile" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>Medical Profile</Text><Text style={styles.subtitle}>Optional information shared only with your consent.</Text><AppCard><SettingsRow detail="No history added" icon="clipboard-text-outline" label="Medical History" /></AppCard><AppCard><SettingsRow detail="No allergies added" icon="alert-circle-outline" label="Allergies" /></AppCard><AppCard><SettingsRow detail="No medications added" icon="pill" label="Current Medications" /></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.patient.primary} name="shield-check-outline" size={20} /><Text style={styles.noteText}>These fields will be encrypted and stored only after the backend and consent flow are implemented.</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xxl }, note: { alignItems: 'flex-start', backgroundColor: colors.patient.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, safeArea: { flex: 1 }, subtitle: { color: colors.text, fontSize: 14, lineHeight: 21, marginBottom: spacing.lg, marginTop: spacing.xs }, });
