import { Stack } from 'expo-router';

import { ChatProvider } from '@/context/chat';
import { ConsultationDraftProvider } from '@/context/consultation-draft';
import { DoctorRequestsProvider } from '@/context/doctor-requests';

export default function RootLayout() {
  return (
    <ChatProvider>
      <ConsultationDraftProvider>
        <DoctorRequestsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          />
        </DoctorRequestsProvider>
      </ConsultationDraftProvider>
    </ChatProvider>
  );
}
