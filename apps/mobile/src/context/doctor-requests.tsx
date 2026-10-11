import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/context/auth';
import { consultationApi, getApiErrorMessage, type ApiConsultation, type ConsultationAttachment } from '@/lib/api';

export type DoctorRequestStatus = 'Open' | 'Accepted' | 'Completed' | 'Cancelled';
export type RequestPriority = 'Standard' | 'Urgent';

export type DoctorRequest = {
  acceptedAt: string | null;
  attachments: ConsultationAttachment[];
  careInstructions: string | null;
  completedAt: string | null;
  concern: string;
  doctorNotes: string | null;
  duration: string;
  id: string;
  patientEmail: string;
  patientLabel: string;
  prescriptionUrl: string | null;
  priority: RequestPriority;
  severity: 'Mild' | 'Moderate' | 'High' | 'Not specified';
  status: DoctorRequestStatus;
  submittedAt: string;
  symptoms: string;
};

type CompleteCaseInput = {
  careInstructions?: string;
  doctorNotes: string;
  prescriptionUrl?: string;
};

type DoctorRequestsContextValue = {
  acceptRequest: (id: string) => Promise<DoctorRequest>;
  activeCases: DoctorRequest[];
  completeCase: (id: string, input: CompleteCaseInput) => Promise<DoctorRequest>;
  completedCases: DoctorRequest[];
  declineRequest: (id: string, reason?: string) => Promise<void>;
  getRequest: (id: string) => DoctorRequest | undefined;
  isLoading: boolean;
  loadError: string | null;
  loadRequest: (id: string) => Promise<DoctorRequest>;
  openRequests: DoctorRequest[];
  refreshRequests: () => Promise<void>;
};

const DoctorRequestsContext = createContext<DoctorRequestsContextValue | null>(null);

function statusFor(consultation: ApiConsultation): DoctorRequestStatus {
  switch (consultation.status) {
    case 'IN_PROGRESS': return 'Accepted';
    case 'COMPLETED': return 'Completed';
    case 'CANCELLED': return 'Cancelled';
    default: return 'Open';
  }
}

function severityFor(value: string | null): DoctorRequest['severity'] {
  if (value === 'SEVERE') return 'High';
  if (value === 'MODERATE') return 'Moderate';
  if (value === 'MILD') return 'Mild';
  return 'Not specified';
}

function toDoctorRequest(consultation: ApiConsultation): DoctorRequest {
  const severity = severityFor(consultation.severity);

  return {
    acceptedAt: consultation.acceptedAt,
    attachments: consultation.attachments.filter((attachment) => attachment.kind === 'PATIENT_IMAGE'),
    careInstructions: consultation.careInstructions,
    completedAt: consultation.completedAt,
    concern: consultation.concernTitle,
    doctorNotes: consultation.doctorNotes,
    duration: consultation.durationText,
    id: consultation.id,
    patientEmail: consultation.patient.email,
    patientLabel: consultation.patient.patientProfile?.fullName ?? consultation.patient.email,
    prescriptionUrl: consultation.prescriptionUrl,
    priority: severity === 'High' ? 'Urgent' : 'Standard',
    severity,
    status: statusFor(consultation),
    submittedAt: consultation.createdAt,
    symptoms: consultation.symptoms,
  };
}

function upsert(current: DoctorRequest[], next: DoctorRequest) {
  return [next, ...current.filter((item) => item.id !== next.id)];
}

export function DoctorRequestsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [openRequests, setOpenRequests] = useState<DoctorRequest[]>([]);
  const [activeCases, setActiveCases] = useState<DoctorRequest[]>([]);
  const [completedCases, setCompletedCases] = useState<DoctorRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const accessToken = session?.user.role === 'DOCTOR' ? session.accessToken : undefined;

  const placeRequest = useCallback((request: DoctorRequest) => {
    setOpenRequests((current) => request.status === 'Open' ? upsert(current, request) : current.filter((item) => item.id !== request.id));
    setActiveCases((current) => request.status === 'Accepted' ? upsert(current, request) : current.filter((item) => item.id !== request.id));
    setCompletedCases((current) => request.status === 'Completed' ? upsert(current, request) : current.filter((item) => item.id !== request.id));
  }, []);

  const refreshRequests = useCallback(async () => {
    if (!accessToken) {
      setOpenRequests([]);
      setActiveCases([]);
      setCompletedCases([]);
      setLoadError(null);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      const [openResponse, mineResponse] = await Promise.all([
        consultationApi.listOpen(accessToken),
        consultationApi.listMine(accessToken),
      ]);
      const open = openResponse.consultations.map(toDoctorRequest);
      const mine = mineResponse.consultations.map(toDoctorRequest);
      setOpenRequests(open);
      setActiveCases(mine.filter((request) => request.status === 'Accepted'));
      setCompletedCases(mine.filter((request) => request.status === 'Completed'));
    } catch (error) {
      setLoadError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      void refreshRequests();
    }, 0);

    return () => clearTimeout(refreshTimer);
  }, [refreshRequests]);

  const loadRequest = useCallback(async (id: string) => {
    if (!accessToken) throw new Error('Sign in as a doctor to view consultations.');

    const response = await consultationApi.getDetails(accessToken, id);
    const request = toDoctorRequest(response.consultation);
    placeRequest(request);
    return request;
  }, [accessToken, placeRequest]);

  const acceptRequest = useCallback(async (id: string) => {
    if (!accessToken) throw new Error('Sign in as a doctor to accept consultations.');

    const response = await consultationApi.accept(accessToken, id);
    const request = toDoctorRequest(response.consultation);
    placeRequest(request);
    return request;
  }, [accessToken, placeRequest]);

  const declineRequest = useCallback(async (id: string, reason?: string) => {
    if (!accessToken) throw new Error('Sign in as a doctor to decline consultations.');

    await consultationApi.decline(accessToken, id, reason);
    setOpenRequests((current) => current.filter((item) => item.id !== id));
  }, [accessToken]);

  const completeCase = useCallback(async (id: string, input: CompleteCaseInput) => {
    if (!accessToken) throw new Error('Sign in as a doctor to complete consultations.');

    const response = await consultationApi.complete(accessToken, id, input);
    const request = toDoctorRequest(response.consultation);
    placeRequest(request);
    return request;
  }, [accessToken, placeRequest]);

  const value = useMemo<DoctorRequestsContextValue>(() => ({
    acceptRequest,
    activeCases,
    completeCase,
    completedCases,
    declineRequest,
    getRequest: (id) => [...openRequests, ...activeCases, ...completedCases].find((request) => request.id === id),
    isLoading,
    loadError,
    loadRequest,
    openRequests,
    refreshRequests,
  }), [acceptRequest, activeCases, completeCase, completedCases, declineRequest, isLoading, loadError, loadRequest, openRequests, refreshRequests]);

  return <DoctorRequestsContext.Provider value={value}>{children}</DoctorRequestsContext.Provider>;
}

export function useDoctorRequests() {
  const context = useContext(DoctorRequestsContext);
  if (!context) throw new Error('useDoctorRequests must be used inside DoctorRequestsProvider.');
  return context;
}
