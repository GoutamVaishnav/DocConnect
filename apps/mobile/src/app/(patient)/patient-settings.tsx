import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function Preference({ description, enabled, label, onChange }: { description: string; enabled: boolean; label: string; onChange: (value: boolean) => void }) {
  return <View style={styles.preference}><View style={styles.copy}><Text style={styles.label}>{label}</Text><Text style={styles.description}>{description}</Text></View><Switch accessibilityLabel={label} onValueChange={onChange} thumbColor={colors.surface} trackColor={{ false: colors.border, true: colors.patient.primary }} value={enabled} /></View>;
}

export default function PatientSettingsScreen() {
  const [consultationUpdates, setConsultationUpdates] = useState(true); const [messages, setMessages] = useState(true); const [marketing, setMarketing] = useState(false);
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Privacy & Settings" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><Text style={typography.screenTitle}>Privacy & Settings</Text><Text style={styles.subtitle}>Choose your local display preferences.</Text><AppCard><Preference description="Updates about your consultation status." enabled={consultationUpdates} label="Consultation Updates" onChange={setConsultationUpdates} /><View style={styles.divider} /><Preference description="New messages from your doctor." enabled={messages} label="Message Alerts" onChange={setMessages} /><View style={styles.divider} /><Preference description="Product tips and reminders." enabled={marketing} label="App Updates" onChange={setMarketing} /></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Preferences are temporary and will be synced after account settings APIs are available.</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, copy: { flex: 1 }, description: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 }, divider: { backgroundColor: colors.border, height: 1, marginLeft: spacing.md }, label: { color: colors.navy, fontSize: 14, fontWeight: '700' }, note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, preference: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 76, paddingHorizontal: spacing.md }, safeArea: { flex: 1 }, subtitle: { color: colors.text, fontSize: 14, marginTop: spacing.xs }, });
