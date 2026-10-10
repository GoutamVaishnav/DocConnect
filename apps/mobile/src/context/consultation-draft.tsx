import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type ConsultationDuration = 'Today' | '1–3 days' | 'About a week' | 'More than a week';

export type ConsultationPhoto = {
  fileName: string;
  id: string;
  uri: string;
};

export type ConsultationStatus = 'In Progress' | 'Pending' | 'Completed' | 'New';

export type ConsultationRecord = {
  doctorName?: string;
  doctorSpecialty?: string;
  duration: ConsultationDuration;
  id: string;
  photos: ConsultationPhoto[];
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

type ConsultationDraftContextValue = {
  clearDraft: () => void;
  consultations: ConsultationRecord[];
  draft: ConsultationDraft;
  getConsultation: (id: string) => ConsultationRecord | undefined;
  setPhotos: (photos: ConsultationPhoto[]) => void;
  submitDraft: () => ConsultationRecord;
  updateDetails: (details: Pick<ConsultationDraft, 'duration' | 'symptoms'>) => void;
};

const emptyDraft: ConsultationDraft = {
  duration: null,
  photos: [],
  symptoms: '',
};

const initialConsultations: ConsultationRecord[] = [
  {
    doctorName: 'Dr. Mehta',
    doctorSpecialty: 'Dermatologist',
    duration: '1–3 days',
    id: 'skin-rash',
    photos: [],
    status: 'In Progress',
    submittedAt: '2 days ago',
    symptoms: 'Red rash on hands, mild itching, and slight swelling.',
    title: 'Skin Rash',
  },
  {
    duration: 'Today',
    id: 'fever',
    photos: [],
    status: 'Pending',
    submittedAt: '3 days ago',
    symptoms: 'Low-grade fever, fatigue, and body ache since this morning.',
    title: 'Fever',
  },
  {
    doctorName: 'Dr. Sharma',
    doctorSpecialty: 'General Physician',
    duration: 'About a week',
    id: 'back-pain',
    photos: [],
    status: 'Completed',
    submittedAt: '5 days ago',
    symptoms: 'Lower back pain that became worse after sitting for long periods.',
    title: 'Back Pain',
  },
];

const ConsultationDraftContext = createContext<ConsultationDraftContextValue | null>(null);

export function ConsultationDraftProvider({ children }: PropsWithChildren) {
  const [draft, setDraft] = useState<ConsultationDraft>(emptyDraft);
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(initialConsultations);

  const value = useMemo<ConsultationDraftContextValue>(
    () => ({
      clearDraft: () => setDraft(emptyDraft),
      consultations,
      draft,
      getConsultation: (id) => consultations.find((consultation) => consultation.id === id),
      setPhotos: (photos) => setDraft((current) => ({ ...current, photos })),
      submitDraft: () => {
        const consultation: ConsultationRecord = {
          duration: draft.duration ?? 'Today',
          id: `consultation-${Date.now()}`,
          photos: draft.photos,
          status: 'Pending',
          submittedAt: 'Just now',
          symptoms: draft.symptoms,
          title: 'New Consultation',
        };

        setConsultations((current) => [consultation, ...current]);
        setDraft(emptyDraft);
        return consultation;
      },
      updateDetails: (details) => setDraft((current) => ({ ...current, ...details })),
    }),
    [consultations, draft],
  );

  return <ConsultationDraftContext.Provider value={value}>{children}</ConsultationDraftContext.Provider>;
}

export function useConsultationDraft() {
  const context = useContext(ConsultationDraftContext);

  if (!context) {
    throw new Error('useConsultationDraft must be used inside ConsultationDraftProvider.');
  }

  return context;
}
