import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/context/auth';
import {
  type ApiConsultation,
  consultationApi,
  type ConsultationAttachment,
  getApiErrorMessage,
} from '@/lib/api';

export type ConsultationDuration = 'Today' | '1–3 days' | 'About a week' | 'More than a week';

export type ConsultationPhoto = {
  fileName: string;
  id: string;
  mimeType?: string | null;
  uri: string;
};

export type ConsultationStatus = 'In Progress' | 'Pending' | 'Completed' | 'Cancelled';

export type ConsultationRecord = {
  acceptedAt: string | null;
  attachments: ConsultationAttachment[];
  careInstructions: string | null;
  completedAt: string | null;
  doctorName?: string;
  doctorNotes: string | null;
  doctorSpecialty?: string;
  duration: string;
  id: string;
  patientEmail?: string;
  patientName?: string;
  prescriptionUrl: string | null;
  status: ConsultationStatus;
  submittedAt: string;
  symptoms: string;
  title: string;
};

type ConsultationDraft = {
  duration: ConsultationDuration | null;
  photos: ConsultationPhoto[];
  symptoms: string;
};

type SubmittedConsultation = {
  consultation: ConsultationRecord;
  failedPhotoCount: number;
};

type ConsultationDraftContextValue = {
  clearDraft: () => void;
  consultations: ConsultationRecord[];
  draft: ConsultationDraft;
  getConsultation: (id: string) => ConsultationRecord | undefined;
  isLoading: boolean;
  loadConsultation: (id: string) => Promise<ConsultationRecord>;
  loadError: string | null;
  refreshConsultations: () => Promise<void>;
  setPhotos: (photos: ConsultationPhoto[]) => void;
  submitDraft: () => Promise<SubmittedConsultation>;
  updateDetails: (details: Pick<ConsultationDraft, 'duration' | 'symptoms'>) => void;
};

const emptyDraft: ConsultationDraft = {
  duration: null,
  photos: [],
  symptoms: '',
};

const statusLabels: Record<ApiConsultation['status'], ConsultationStatus> = {
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  IN_PROGRESS: 'In Progress',
  PENDING: 'Pending',
};

const ConsultationDraftContext = createContext<ConsultationDraftContextValue | null>(null);

function toConsultationRecord(consultation: ApiConsultation): ConsultationRecord {
  const doctorProfile = consultation.doctor?.doctorProfile;

  return {
    acceptedAt: consultation.acceptedAt,
    attachments: consultation.attachments.filter((attachment) => attachment.kind === 'PATIENT_IMAGE'),
    careInstructions: consultation.careInstructions,
    completedAt: consultation.completedAt,
    doctorName: doctorProfile?.fullName ?? consultation.doctor?.email,
    doctorNotes: consultation.doctorNotes,
    doctorSpecialty: doctorProfile?.specialty,
    duration: consultation.durationText,
    id: consultation.id,
    patientEmail: consultation.patient.email,
    patientName: consultation.patient.patientProfile?.fullName ?? consultation.patient.email,
    prescriptionUrl: consultation.prescriptionUrl,
    status: statusLabels[consultation.status],
    submittedAt: consultation.createdAt,
    symptoms: consultation.symptoms,
    title: consultation.concernTitle,
  };
}

function titleFromSymptoms(symptoms: string) {
  const firstLine = symptoms.split(/[.!?\n]/)[0]?.trim() || 'Medical consultation';
  return firstLine.slice(0, 160);
}

function upsertConsultation(current: ConsultationRecord[], next: ConsultationRecord) {
  return [next, ...current.filter((consultation) => consultation.id !== next.id)];
}

export function formatConsultationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Recently';
  }

  const differenceInMinutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));

  if (differenceInMinutes < 1) {
    return 'Just now';
  }

  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} min ago`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours < 24) {
    return `${differenceInHours}h ago`;
  }

  const differenceInDays = Math.floor(differenceInHours / 24);
  return `${differenceInDays} day${differenceInDays === 1 ? '' : 's'} ago`;
}

export function ConsultationDraftProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [draft, setDraft] = useState<ConsultationDraft>(emptyDraft);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const accessToken = session?.accessToken;
  const isPatientSession = session?.user.role === 'PATIENT';

  const refreshConsultations = useCallback(async () => {
    if (!accessToken || !isPatientSession) {
      setConsultations([]);
      setLoadError(null);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const response = await consultationApi.listMine(accessToken);
      setConsultations(response.consultations.map(toConsultationRecord));
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, isPatientSession]);

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      void refreshConsultations();
    }, 0);

    return () => clearTimeout(refreshTimer);
  }, [refreshConsultations]);

  const loadConsultation = useCallback(async (consultationId: string) => {
    if (!accessToken) {
      throw new Error('Sign in as a patient to view consultations.');
    }

    const response = await consultationApi.getDetails(accessToken, consultationId);
    const record = toConsultationRecord(response.consultation);
    setConsultations((current) => upsertConsultation(current, record));
    return record;
  }, [accessToken]);

  const submitDraft = useCallback(async (): Promise<SubmittedConsultation> => {
    if (!accessToken) {
      throw new Error('Sign in as a patient before submitting a consultation.');
    }

    const symptoms = draft.symptoms.trim();
    if (!draft.duration || symptoms.length < 10) {
      throw new Error('Add at least 10 characters of symptoms and select the duration.');
    }

    const created = await consultationApi.create(accessToken, {
      concernTitle: titleFromSymptoms(symptoms),
      durationText: draft.duration,
      symptoms,
    });
    let failedPhotoCount = 0;

    for (const photo of draft.photos) {
      try {
        await consultationApi.uploadImage(accessToken, created.consultation.id, photo);
      } catch {
        failedPhotoCount += 1;
      }
    }

    const detailed = await consultationApi.getDetails(accessToken, created.consultation.id);
    const consultation = toConsultationRecord(detailed.consultation);
    setConsultations((current) => upsertConsultation(current, consultation));
    setDraft(emptyDraft);

    return { consultation, failedPhotoCount };
  }, [accessToken, draft]);

  const value = useMemo<ConsultationDraftContextValue>(() => ({
    clearDraft: () => setDraft(emptyDraft),
    consultations,
    draft,
    getConsultation: (id) => consultations.find((consultation) => consultation.id === id),
    isLoading,
    loadConsultation,
    loadError,
    refreshConsultations,
    setPhotos: (photos) => setDraft((current) => ({ ...current, photos })),
    submitDraft,
    updateDetails: (details) => setDraft((current) => ({ ...current, ...details })),
  }), [consultations, draft, isLoading, loadConsultation, loadError, refreshConsultations, submitDraft]);

  return <ConsultationDraftContext.Provider value={value}>{children}</ConsultationDraftContext.Provider>;
}

export function useConsultationDraft() {
  const context = useContext(ConsultationDraftContext);

  if (!context) {
    throw new Error('useConsultationDraft must be used inside ConsultationDraftProvider.');
  }

  return context;
}
