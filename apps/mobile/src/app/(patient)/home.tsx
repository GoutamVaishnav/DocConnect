import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { BottomNav } from '@/components/bottom-nav';
import { StatusBadge } from '@/components/status-badge';
import { useAuth } from '@/context/auth';
import { formatConsultationDate, useConsultationDraft } from '@/context/consultation-draft';
import { usePatientProfile } from '@/context/patient-profile';
import { getApiErrorMessage, profileApi, type ApiListedDoctor } from '@/lib/api';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

function getInitials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P';
}

function DoctorCard({ doctor }: { doctor: ApiListedDoctor }) {
  const availabilityLabel = doctor.availabilityEnabled ? 'Available for requests' : 'Currently unavailable';
  const verificationLabel = doctor.verificationStatus === 'VERIFIED' ? 'Verified' : 'Profile review pending';

  return (
    <AppCard>
      <View style={styles.doctorCard}>
        <View style={styles.doctorAvatar}><Text style={styles.doctorInitials}>{getInitials(doctor.fullName)}</Text></View>
        <View style={styles.doctorCopy}>
          <Text style={styles.doctorName}>{doctor.fullName}</Text>
          <Text style={styles.doctorSpecialty}>{doctor.specialty}</Text>
          <View style={styles.doctorMeta}>
            <View style={[styles.availabilityDot, { backgroundColor: doctor.availabilityEnabled ? colors.success : colors.muted }]} />
            <Text style={styles.doctorMetaText}>{availabilityLabel}</Text>
          </View>
        </View>
        <View style={[styles.verificationBadge, doctor.verificationStatus !== 'VERIFIED' && styles.pendingBadge]}>
          <Text style={[styles.verificationText, doctor.verificationStatus !== 'VERIFIED' && styles.pendingText]}>{verificationLabel}</Text>
        </View>
      </View>
    </AppCard>
  );
}

export default function PatientHomeScreen() {
  const { session } = useAuth();
  const { consultations, isLoading: isLoadingConsultations } = useConsultationDraft();
  const { profile } = usePatientProfile();
  const [doctors, setDoctors] = useState<ApiListedDoctor[]>([]);
  const [doctorLoadError, setDoctorLoadError] = useState<string | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const latestConsultation = consultations[0];
  const activeConsultation = consultations.find((consultation) => consultation.status === 'In Progress');
  const patientName = profile?.fullName || session?.user.email || 'Patient';

  const loadDoctors = useCallback(async () => {
    if (!session?.accessToken || session.user.role !== 'PATIENT') {
      setDoctors([]);
      return;
    }

    try {
      setIsLoadingDoctors(true);
      setDoctorLoadError(null);
      const response = await profileApi.listDoctors(session.accessToken);
      setDoctors(response.doctors);
    } catch (error) {
      setDoctorLoadError(getApiErrorMessage(error));
    } finally {
      setIsLoadingDoctors(false);
    }
  }, [session]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadDoctors();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadDoctors]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(patientName)}</Text></View>
            <View style={styles.greeting}>
              <Text style={styles.hello}>Hello, {patientName}</Text>
              <Text style={styles.subGreeting}>How can we help you today?</Text>
            </View>
            <Pressable accessibilityLabel="Notifications" onPress={() => router.push('/patient-notifications')} style={styles.bell}>
              <MaterialCommunityIcons color={colors.navy} name="bell-outline" size={23} />
            </Pressable>
          </View>

          <View style={styles.adviceCard}>
            <View style={styles.adviceIcon}><MaterialCommunityIcons color={colors.surface} name="stethoscope" size={28} /></View>
            <View style={styles.adviceCopy}>
              <Text style={styles.adviceTitle}>Get Medical Advice</Text>
              <Text style={styles.adviceDescription}>Submit a request for an available doctor</Text>
            </View>
            <Pressable accessibilityLabel="Start a consultation" onPress={() => router.push('/new-consultation')}>
              <MaterialCommunityIcons color={colors.surface} name="arrow-right" size={26} />
            </Pressable>
          </View>

          <View style={styles.sectionHeader}><Text style={typography.sectionTitle}>Registered Doctors</Text><Pressable onPress={() => void loadDoctors()}><Text style={styles.link}>Refresh</Text></Pressable></View>
          <Text style={styles.directoryNote}>Only doctors who have created a professional profile are shown here. Available doctors can accept new requests.</Text>
          {isLoadingDoctors ? <View style={styles.loadingDoctors}><ActivityIndicator color={colors.patient.primary} /><Text style={styles.loadingText}>Loading doctors…</Text></View> : null}
          {!isLoadingDoctors && doctors.length === 0 ? <View style={styles.emptyDoctors}><MaterialCommunityIcons color={colors.muted} name="doctor" size={30} /><Text style={styles.emptyDoctorsText}>No doctor profiles are available yet.</Text></View> : null}
          {doctors.map((doctor) => <DoctorCard doctor={doctor} key={doctor.id} />)}
          {doctorLoadError ? <View style={styles.errorNote}><MaterialCommunityIcons color="#D93B3B" name="alert-circle-outline" size={19} /><Text style={styles.errorText}>{doctorLoadError}</Text></View> : null}

          <View style={styles.sectionHeader}><Text style={typography.sectionTitle}>Your Consultations</Text><Pressable onPress={() => router.push('/consultations')}><Text style={styles.link}>View all</Text></Pressable></View>
          {isLoadingConsultations && !latestConsultation ? <View style={styles.loadingConsultations}><ActivityIndicator color={colors.patient.primary} /><Text style={styles.loadingText}>Loading consultations…</Text></View> : latestConsultation ? <AppCard><Pressable onPress={() => router.push({ pathname: '/consultations/[consultationId]', params: { consultationId: latestConsultation.id } })} style={styles.consultationCard}><View style={styles.caseImage}><MaterialCommunityIcons color={colors.patient.primary} name={latestConsultation.attachments.length > 0 ? 'image-multiple-outline' : 'clipboard-text-outline'} size={25} /></View><View style={styles.caseCopy}><Text style={styles.caseTitle}>{latestConsultation.title}</Text><Text style={styles.caseDoctor}>{latestConsultation.doctorName ?? 'Waiting for a doctor'}</Text><Text style={styles.caseTime}>{formatConsultationDate(latestConsultation.submittedAt)}</Text></View><View style={styles.caseMeta}><StatusBadge status={latestConsultation.status} /><MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} /></View></Pressable></AppCard> : <View style={styles.emptyConsultations}><MaterialCommunityIcons color={colors.muted} name="clipboard-text-outline" size={28} /><Text style={styles.emptyConsultationsText}>No consultations yet. Start one whenever you need medical advice.</Text></View>}

          <View style={styles.sectionHeader}><Text style={typography.sectionTitle}>Recent Messages</Text></View>
          {activeConsultation ? <AppCard><Pressable onPress={() => router.push({ pathname: '/chat/[conversationId]', params: { conversationId: activeConsultation.id, role: 'patient' } })} style={styles.messageCard}><View style={styles.messageAvatar}><MaterialCommunityIcons color={colors.doctor.primary} name="doctor" size={23} /></View><View style={styles.caseCopy}><Text style={styles.caseTitle}>{activeConsultation.doctorName ?? 'Your doctor'}</Text><Text numberOfLines={1} style={styles.messagePreview}>Open your active consultation chat</Text></View><MaterialCommunityIcons color={colors.muted} name="chevron-right" size={22} /></Pressable></AppCard> : <Text style={styles.noMessages}>Messages will appear when a doctor accepts a consultation.</Text>}

          <View style={styles.helpCard}><MaterialCommunityIcons color={colors.patient.primary} name="shield-check-outline" size={21} /><Text style={styles.helpText}>Your medical information is private and shared only with your care team.</Text></View>
          <AppButton icon="plus" label="Start a consultation" onPress={() => router.push('/new-consultation')} />
        </ScrollView>
      </SafeAreaView>
      <BottomNav role="patient" />
    </View>
  );
}

const styles = StyleSheet.create({
  adviceCard: { alignItems: 'center', backgroundColor: colors.patient.primary, borderRadius: radius.lg, flexDirection: 'row', marginTop: spacing.lg, padding: spacing.lg },
  adviceCopy: { flex: 1, marginLeft: spacing.sm }, adviceDescription: { color: '#DCEEFF', fontSize: 12, marginTop: 3 }, adviceIcon: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.md, height: 52, justifyContent: 'center', width: 52 }, adviceTitle: { color: colors.surface, fontSize: 17, fontWeight: '700' },
  avatar: { alignItems: 'center', backgroundColor: colors.patient.softStrong, borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 }, avatarText: { color: colors.patient.primaryDark, fontSize: 13, fontWeight: '700' }, bell: { padding: 7 },
  availabilityDot: { borderRadius: radius.pill, height: 7, width: 7 }, caseCopy: { flex: 1 }, caseDoctor: { color: colors.text, fontSize: 12, marginTop: 2 }, caseImage: { alignItems: 'center', backgroundColor: colors.patient.soft, borderRadius: radius.sm, height: 55, justifyContent: 'center', width: 55 }, caseMeta: { alignItems: 'flex-end', gap: spacing.xs }, caseTime: { color: colors.muted, fontSize: 10, marginTop: 5 }, caseTitle: { color: colors.navy, fontSize: 14, fontWeight: '700' }, consultationCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  container: { backgroundColor: colors.canvas, flex: 1 }, content: { gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xl }, directoryNote: { color: colors.text, fontSize: 12, lineHeight: 18, marginBottom: spacing.xs },
  doctorAvatar: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 50, justifyContent: 'center', width: 50 }, doctorCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }, doctorCopy: { flex: 1 }, doctorInitials: { color: colors.doctor.primaryDark, fontSize: 15, fontWeight: '700' }, doctorMeta: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 5 }, doctorMetaText: { color: colors.muted, fontSize: 10 }, doctorName: { color: colors.navy, fontSize: 14, fontWeight: '700' }, doctorSpecialty: { color: colors.text, fontSize: 12, marginTop: 2 },
  emptyConsultations: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg }, emptyConsultationsText: { color: colors.text, fontSize: 12, lineHeight: 18, textAlign: 'center' }, emptyDoctors: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.lg }, emptyDoctorsText: { color: colors.text, fontSize: 12 },
  errorNote: { alignItems: 'flex-start', backgroundColor: '#FFF0F0', borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, padding: spacing.md }, errorText: { color: colors.text, flex: 1, fontSize: 12, lineHeight: 18 }, greeting: { flex: 1, marginLeft: spacing.sm }, header: { alignItems: 'center', flexDirection: 'row' }, hello: { color: colors.navy, fontSize: 16, fontWeight: '700' }, helpCard: { alignItems: 'flex-start', backgroundColor: colors.patient.soft, borderRadius: radius.md, flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs, padding: spacing.sm }, helpText: { color: colors.text, flex: 1, fontSize: 11, lineHeight: 16 },
  link: { color: colors.patient.primary, fontSize: 12, fontWeight: '700' }, loadingConsultations: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', padding: spacing.lg }, loadingDoctors: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.md }, loadingText: { color: colors.muted, fontSize: 12 }, messageAvatar: { alignItems: 'center', backgroundColor: colors.doctor.soft, borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 }, messageCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }, messagePreview: { color: colors.text, fontSize: 12, marginTop: 3 }, noMessages: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: spacing.xs },
  pendingBadge: { backgroundColor: colors.warningSoft }, pendingText: { color: colors.warning }, safeArea: { flex: 1 }, sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.lg }, subGreeting: { color: colors.muted, fontSize: 11, marginTop: 2 }, verificationBadge: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4 }, verificationText: { color: colors.success, fontSize: 9, fontWeight: '700' },
});
