import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { isRunningInExpoGo } from 'expo';

import { useAuth } from '@/context/auth';
import { type ApiNotification, type ApiNotificationType, notificationApi } from '@/lib/api';
import { isConsultationId, openChat } from '@/lib/chat-navigation';
import { createChatSocket } from '@/lib/realtime-chat';

type NotificationsContextValue = {
  error: string | null;
  isLoading: boolean;
  markAllRead: () => Promise<void>;
  notifications: ApiNotification[];
  openNotification: (notification: ApiNotification) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  unreadCount: number;
};

type ExpoNotificationsModule = typeof import('expo-notifications');
type NotificationResponse = import('expo-notifications').NotificationResponse;

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

// Expo Go on Android throws merely when expo-notifications is loaded. Keep the
// import lazy so Expo Go can still run every non-push feature of the app.
function loadNativeNotifications(): ExpoNotificationsModule | undefined {
  if (Platform.OS === 'web' || isRunningInExpoGo()) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must not load this native module in Expo Go.
  return require('expo-notifications') as ExpoNotificationsModule;
}

const nativeNotifications = loadNativeNotifications();

if (nativeNotifications) {
  nativeNotifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

function isNotificationType(value: unknown): value is ApiNotificationType {
  return value === 'CONSULTATION_REQUEST'
    || value === 'CONSULTATION_ACCEPTED'
    || value === 'CONSULTATION_COMPLETED'
    || value === 'CHAT_MESSAGE';
}

function openConsultationFromNotification(role: 'DOCTOR' | 'PATIENT', type: unknown, consultationId: unknown) {
  if (!isConsultationId(consultationId)) {
    return;
  }

  if (type === 'CHAT_MESSAGE') {
    openChat(consultationId, role === 'DOCTOR' ? 'doctor' : 'patient');
    return;
  }

  if (role === 'DOCTOR') {
    router.push({ pathname: '/cases/[caseId]', params: { caseId: consultationId } });
  } else {
    router.push({ pathname: '/consultations/[consultationId]', params: { consultationId } });
  }
}

function getExpoProjectId() {
  const appExtra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return appExtra?.eas?.projectId || Constants.easConfig?.projectId;
}

async function registerDeviceForPushNotifications(accessToken: string) {
  // Push delivery needs a physical Android/iOS app. The web build still receives
  // live in-app events through Socket.IO.
  // Android Expo Go no longer supports remote push token registration. Keep
  // Socket.IO in-app notifications working there, and enable device push only
  // in an EAS development/production build.
  if (Platform.OS === 'web' || !Device.isDevice || isRunningInExpoGo() || !nativeNotifications) {
    return;
  }

  if (Platform.OS === 'android') {
    await nativeNotifications.setNotificationChannelAsync('docconnect-updates', {
      importance: nativeNotifications.AndroidImportance.MAX,
      name: 'DocConnect updates',
    });
  }

  const currentPermissions = await nativeNotifications.getPermissionsAsync();
  const permission = currentPermissions.granted
    ? currentPermissions
    : await nativeNotifications.requestPermissionsAsync();
  if (!permission.granted) {
    return;
  }

  const projectId = getExpoProjectId();
  if (!projectId) {
    // EAS build:configure adds this non-secret id when the app is ready for a device build.
    return;
  }

  const token = (await nativeNotifications.getExpoPushTokenAsync({ projectId })).data;
  await notificationApi.registerPushToken(accessToken, {
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    token,
  });
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshNotifications = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const page = await notificationApi.list(session.accessToken);
      setNotifications(page.notifications);
    } catch {
      setError('Notifications could not be loaded. Pull down to try again.');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  const markRead = useCallback(async (notification: ApiNotification) => {
    if (!session || notification.readAt) {
      return;
    }

    try {
      const result = await notificationApi.markRead(session.accessToken, notification.id);
      setNotifications((current) => current.map((item) => (
        item.id === result.notification.id ? result.notification : item
      )));
    } catch {
      // Opening a notification should still navigate even if a temporary network error prevents marking it read.
    }
  }, [session]);

  const openNotification = useCallback(async (notification: ApiNotification) => {
    await markRead(notification);
    openConsultationFromNotification(session?.user.role || 'PATIENT', notification.type, notification.consultationId);
  }, [markRead, session?.user.role]);

  const markAllRead = useCallback(async () => {
    if (!session) {
      return;
    }

    await notificationApi.markAllRead(session.accessToken);
    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || readAt })));
  }, [session]);

  useEffect(() => {
    if (!session) {
      const resetTimer = setTimeout(() => {
        setError(null);
        setIsLoading(false);
        setNotifications([]);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const socket = createChatSocket(session.accessToken);
    const initialLoadTimer = setTimeout(() => void refreshNotifications(), 0);

    socket.on('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)]);
    });
    socket.connect();
    void registerDeviceForPushNotifications(session.accessToken).catch(() => {
      // Notification list and in-app real-time events work even when OS permission is denied.
    });

    return () => {
      clearTimeout(initialLoadTimer);
      socket.disconnect();
    };
  }, [refreshNotifications, session]);

  useEffect(() => {
    if (!session || !nativeNotifications) {
      return undefined;
    }

    const handleResponse = (response: NotificationResponse | null) => {
      if (!response) {
        return;
      }

      const data = response.notification.request.content.data || {};
      const notificationId = data.notificationId;
      const type = data.notificationType;
      if (typeof notificationId === 'string') {
        void notificationApi.markRead(session.accessToken, notificationId)
          .then((result) => {
            setNotifications((current) => current.map((item) => (
              item.id === result.notification.id ? result.notification : item
            )));
          })
          .catch(() => undefined);
      }
      openConsultationFromNotification(session.user.role, isNotificationType(type) ? type : undefined, data.consultationId);
    };

    const responseSubscription = nativeNotifications.addNotificationResponseReceivedListener(handleResponse);
    handleResponse(nativeNotifications.getLastNotificationResponse());

    return () => responseSubscription.remove();
  }, [session]);

  const value = useMemo<NotificationsContextValue>(() => ({
    error,
    isLoading,
    markAllRead,
    notifications,
    openNotification,
    refreshNotifications,
    unreadCount: notifications.filter((notification) => !notification.readAt).length,
  }), [error, isLoading, markAllRead, notifications, openNotification, refreshNotifications]);

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationsProvider.');
  }

  return context;
}
