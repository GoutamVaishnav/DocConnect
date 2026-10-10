import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

export type DoctorRequestStatus = 'Open' | 'Accepted' | 'Completed';
export type RequestPriority = 'Standard' | 'Urgent';

export type DoctorRequest = {
  age: number;
  concern: string;
  duration: string;
  id: string;
  patientLabel: string;
  priority: RequestPriority;
  severity: 'Mild' | 'Moderate' | 'High';
  status: DoctorRequestStatus;
  submittedAt: string;
  symptoms: string;
};

export type CaseSummary = {
  instructions: string;
  notes: string;
  prescriptionName: string;
};

type DoctorRequestsContextValue = {
  acceptRequest: (id: string) => DoctorRequest | undefined;
  acceptedCases: DoctorRequest[];
  completeCase: (id: string) => DoctorRequest | undefined;
  completedCases: DoctorRequest[];
  getRequest: (id: string) => DoctorRequest | undefined;
  getSummary: (id: string) => CaseSummary | undefined;
  openRequests: DoctorRequest[];
  saveSummary: (id: string, summary: CaseSummary) => void;
};

const initialOpenRequests: DoctorRequest[] = [
  {
    age: 28,
    concern: 'Skin Rash',
    duration: '2 days',
    id: 'patient-1042',
    patientLabel: 'Patient #1042',
    priority: 'Standard',
    severity: 'Moderate',
    status: 'Open',
    submittedAt: '2 hours ago',
    symptoms: 'Red rash on hand, itching, and mild swelling.',
  },
  {
    age: 34,
    concern: 'Fever & Cold',
    duration: '1 day',
    id: 'patient-0987',
    patientLabel: 'Patient #0987',
    priority: 'Standard',
    severity: 'Mild',
    status: 'Open',
    submittedAt: '4 hours ago',
    symptoms: 'Low-grade fever, sore throat, and tiredness since yesterday.',
  },
  {
    age: 42,
    concern: 'Back Pain',
    duration: '5 days',
    id: 'patient-0765',
    patientLabel: 'Patient #0765',
    priority: 'Urgent',
    severity: 'High',
    status: 'Open',
    submittedAt: '5 hours ago',
    symptoms: 'Persistent lower-back pain that makes normal movement difficult.',
  },
];

const initialAcceptedCases: DoctorRequest[] = [
  {
    age: 31,
    concern: 'Headache',
    duration: '3 days',
    id: 'patient-0632',
    patientLabel: 'Patient #0632',
    priority: 'Standard',
    severity: 'Mild',
    status: 'Accepted',
    submittedAt: '1 day ago',
    symptoms: 'Recurring headache with tiredness over the last few days.',
  },
];

const DoctorRequestsContext = createContext<DoctorRequestsContextValue | null>(null);

export function DoctorRequestsProvider({ children }: PropsWithChildren) {
  const [openRequests, setOpenRequests] = useState<DoctorRequest[]>(initialOpenRequests);
  const [acceptedCases, setAcceptedCases] = useState<DoctorRequest[]>(initialAcceptedCases);
  const [completedCases, setCompletedCases] = useState<DoctorRequest[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CaseSummary>>({});

  const value = useMemo<DoctorRequestsContextValue>(
    () => ({
      acceptRequest: (id) => {
        const request = openRequests.find((item) => item.id === id);

        if (!request) {
          return undefined;
        }

        const acceptedRequest: DoctorRequest = { ...request, status: 'Accepted' };
        setOpenRequests((current) => current.filter((item) => item.id !== id));
        setAcceptedCases((current) => [acceptedRequest, ...current]);
        return acceptedRequest;
      },
      acceptedCases,
      completeCase: (id) => {
        const caseItem = acceptedCases.find((item) => item.id === id);

        if (!caseItem) {
          return undefined;
        }

        const completedCase: DoctorRequest = { ...caseItem, status: 'Completed' };
        setAcceptedCases((current) => current.filter((item) => item.id !== id));
        setCompletedCases((current) => [completedCase, ...current]);
        return completedCase;
      },
      completedCases,
      getRequest: (id) => [...openRequests, ...acceptedCases, ...completedCases].find((item) => item.id === id),
      getSummary: (id) => summaries[id],
      openRequests,
      saveSummary: (id, summary) => setSummaries((current) => ({ ...current, [id]: summary })),
    }),
    [acceptedCases, completedCases, openRequests, summaries],
  );

  return <DoctorRequestsContext.Provider value={value}>{children}</DoctorRequestsContext.Provider>;
}

export function useDoctorRequests() {
  const context = useContext(DoctorRequestsContext);

  if (!context) {
    throw new Error('useDoctorRequests must be used inside DoctorRequestsProvider.');
  }

  return context;
}
