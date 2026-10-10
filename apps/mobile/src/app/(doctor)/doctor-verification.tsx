import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/app-card';
import { ScreenHeader } from '@/components/screen-header';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

const items = ['Identity Proof', 'Medical Registration', 'Professional Details'] as const;

export default function DoctorVerificationScreen() {
  return <View style={styles.container}><SafeAreaView edges={['top']} style={styles.safeArea}><ScreenHeader title="Verification" /><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.hero}><View style={styles.heroIcon}><MaterialCommunityIcons color={colors.doctor.primary} name="shield-check-outline" size={47} /></View><Text style={typography.sectionTitle}>Verification complete</Text><Text style={styles.heroText}>Your sample professional documents are shown as verified in this UI.</Text></View><AppCard><View style={styles.list}>{items.map((item, index) => <View key={item} style={[styles.row, index !== items.length - 1 && styles.rowBorder]}><View style={styles.rowIcon}><MaterialCommunityIcons color={colors.success} name="check" size={16} /></View><Text style={styles.rowText}>{item}</Text><Text style={styles.status}>Verified</Text></View>)}</View></AppCard><View style={styles.note}><MaterialCommunityIcons color={colors.warning} name="information-outline" size={20} /><Text style={styles.noteText}>Real document upload, review, and approval must be handled by secure backend services.</Text></View></ScrollView></SafeAreaView></View>;
}

const styles = StyleSheet.create({ container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xxl }, hero: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }, heroIcon: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 108, justifyContent: 'center', marginBottom: spacing.md, width: 108 }, heroText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, textAlign: 'center' }, list: { paddingHorizontal: spacing.md }, note: { alignItems: 'flex-start', backgroundColor: colors.warningSoft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, noteText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 58 }, rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 }, rowIcon: { alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.pill, height: 26, justifyContent: 'center', width: 26 }, rowText: { color: colors.navy, flex: 1, fontSize: 13, fontWeight: '600' }, safeArea: { flex: 1 }, status: { color: colors.success, fontSize: 11, fontWeight: '700' }, });
