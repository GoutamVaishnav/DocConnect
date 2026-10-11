import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { AuthenticatedUser } from '@/lib/api';

type AuthSession = {
  accessToken: string;
  user: AuthenticatedUser;
};

type AuthContextValue = {
  isLoading: boolean;
  session: AuthSession | null;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const storageKey = 'docconnect.auth.session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function readStoredSession() {
  const serializedSession = Platform.OS === 'web'
    ? typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    : await SecureStore.getItemAsync(storageKey);

  if (!serializedSession) {
    return null;
  }

  try {
    const parsed = JSON.parse(serializedSession) as AuthSession;
    const isValid = typeof parsed.accessToken === 'string'
      && typeof parsed.user?.id === 'string'
      && typeof parsed.user?.email === 'string'
      && (parsed.user.role === 'PATIENT' || parsed.user.role === 'DOCTOR');
    return isValid ? parsed : null;
  } catch {
    return null;
  }
}

async function saveStoredSession(session: AuthSession | null) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return;
    }

    if (session) {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } else {
      localStorage.removeItem(storageKey);
    }
    return;
  }

  if (session) {
    await SecureStore.setItemAsync(storageKey, JSON.stringify(session));
  } else {
    await SecureStore.deleteItemAsync(storageKey);
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void readStoredSession()
      .then((storedSession) => {
        if (isMounted) {
          setSession(storedSession);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    isLoading,
    session,
    signIn: async (nextSession) => {
      await saveStoredSession(nextSession);
      setSession(nextSession);
    },
    signOut: async () => {
      await saveStoredSession(null);
      setSession(null);
    },
  }), [isLoading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
