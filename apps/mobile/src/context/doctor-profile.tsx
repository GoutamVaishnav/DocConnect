import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/context/auth';
import { getApiErrorMessage, profileApi, type ApiDoctorProfile } from '@/lib/api';

type DoctorProfileContextValue = {
  error: string | null;
  isLoading: boolean;
  profile: ApiDoctorProfile | null;
  refreshProfile: () => Promise<void>;
  saveProfile: (input: { fullName: string; registrationNumber?: string; specialty: string }) => Promise<ApiDoctorProfile>;
  setAvailability: (enabled: boolean) => Promise<void>;
};

const DoctorProfileContext = createContext<DoctorProfileContextValue | null>(null);

function readDoctorProfile(profile: { doctorProfile: ApiDoctorProfile | null }) {
  return profile.doctorProfile;
}

export function DoctorProfileProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<ApiDoctorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = session?.user.role === 'DOCTOR' ? session.accessToken : undefined;

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
      setProfile(readDoctorProfile(response.profile));
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

  const saveProfile = useCallback(async (input: { fullName: string; registrationNumber?: string; specialty: string }) => {
    if (!accessToken) throw new Error('Sign in as a doctor to save your profile.');
    const response = await profileApi.saveDoctorProfile(accessToken, input);
    const nextProfile = readDoctorProfile(response.profile);
    if (!nextProfile) throw new Error('The server did not return a doctor profile.');
    setProfile(nextProfile);
    return nextProfile;
  }, [accessToken]);

  const setAvailability = useCallback(async (enabled: boolean) => {
    if (!accessToken) throw new Error('Sign in as a doctor to change availability.');
    const response = await profileApi.setDoctorAvailability(accessToken, enabled);
    const nextProfile = readDoctorProfile(response.profile);
    if (!nextProfile) throw new Error('Create your doctor profile before changing availability.');
    setProfile(nextProfile);
  }, [accessToken]);

  const value = useMemo<DoctorProfileContextValue>(() => ({ error, isLoading, profile, refreshProfile, saveProfile, setAvailability }), [error, isLoading, profile, refreshProfile, saveProfile, setAvailability]);
  return <DoctorProfileContext.Provider value={value}>{children}</DoctorProfileContext.Provider>;
}

export function useDoctorProfile() {
  const context = useContext(DoctorProfileContext);
  if (!context) throw new Error('useDoctorProfile must be used inside DoctorProfileProvider.');
  return context;
}
