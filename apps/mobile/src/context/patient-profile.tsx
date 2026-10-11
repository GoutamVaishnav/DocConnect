import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/context/auth';
import { getApiErrorMessage, profileApi, type ApiProfile } from '@/lib/api';

type PatientProfileContextValue = {
  error: string | null;
  isLoading: boolean;
  profile: ApiProfile['patientProfile'];
  refreshProfile: () => Promise<void>;
};

const PatientProfileContext = createContext<PatientProfileContextValue | null>(null);

export function PatientProfileProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ApiProfile['patientProfile']>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = session?.user.role === 'PATIENT' ? session.accessToken : undefined;

  const refreshProfile = useCallback(async () => {
    if (!accessToken) {
      setProfile(null);
      setError(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await profileApi.getCurrentProfile(accessToken);
      setProfile(response.profile.patientProfile);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      void refreshProfile();
    }, 0);

    return () => clearTimeout(refreshTimer);
  }, [refreshProfile]);

  const value = useMemo<PatientProfileContextValue>(
    () => ({ error, isLoading, profile, refreshProfile }),
    [error, isLoading, profile, refreshProfile],
  );

  return <PatientProfileContext.Provider value={value}>{children}</PatientProfileContext.Provider>;
}

export function usePatientProfile() {
  const context = useContext(PatientProfileContext);
  if (!context) {
    throw new Error('usePatientProfile must be used inside PatientProfileProvider.');
  }

  return context;
}
