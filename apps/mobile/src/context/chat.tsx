import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react';

import type { AppRole } from '@/theme/colors';

export type ChatMessage = {
  id: string;
  sender: AppRole;
  sentAt: string;
  text: string;
};

export type ChatConversation = {
  id: string;
  participantName: string;
  participantSubtitle: string;
  messages: ChatMessage[];
};

type ChatContextValue = {
  getConversation: (id: string) => ChatConversation | undefined;
  sendMessage: (conversationId: string, sender: AppRole, text: string) => void;
};

const initialConversations: ChatConversation[] = [
  {
    id: 'patient-skin-rash',
    participantName: 'Dr. Mehta',
    participantSubtitle: 'Dermatologist',
    messages: [
      {
        id: 'patient-skin-rash-1',
        sender: 'doctor',
        sentAt: '10:20 AM',
        text: 'Hello, I have reviewed your photos. Can you tell me when the rash began?',
      },
      {
        id: 'patient-skin-rash-2',
        sender: 'patient',
        sentAt: '10:21 AM',
        text: 'It started about 2 days ago and has been itchy since then.',
      },
    ],
  },
  {
    id: 'doctor-patient-1042',
    participantName: 'Patient #1042',
    participantSubtitle: 'Skin Rash consultation',
    messages: [
      {
        id: 'doctor-patient-1042-1',
        sender: 'patient',
        sentAt: '10:20 AM',
        text: 'The rash has been itchy for the last 2 days. I added sample attachments for review.',
      },
    ],
  },
  {
    id: 'doctor-patient-0632',
    participantName: 'Patient #0632',
    participantSubtitle: 'Headache consultation',
    messages: [
      {
        id: 'doctor-patient-0632-1',
        sender: 'patient',
        sentAt: '9:10 AM',
        text: 'I have had a recurring headache and tiredness for the last few days.',
      },
    ],
  },
  {
    id: 'doctor-patient-0987',
    participantName: 'Patient #0987',
    participantSubtitle: 'Fever & Cold consultation',
    messages: [
      {
        id: 'doctor-patient-0987-1',
        sender: 'patient',
        sentAt: '9:40 AM',
        text: 'I have had a mild fever and sore throat since yesterday.',
      },
    ],
  },
  {
    id: 'doctor-patient-0765',
    participantName: 'Patient #0765',
    participantSubtitle: 'Back Pain consultation',
    messages: [
      {
        id: 'doctor-patient-0765-1',
        sender: 'patient',
        sentAt: '9:15 AM',
        text: 'My lower-back pain has made it difficult to move normally.',
      },
    ],
  },
];

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: PropsWithChildren) {
  const [conversations, setConversations] = useState<ChatConversation[]>(initialConversations);

  const value = useMemo<ChatContextValue>(
    () => ({
      getConversation: (id) => conversations.find((conversation) => conversation.id === id),
      sendMessage: (conversationId, sender, text) => {
        const messageText = text.trim();

        if (!messageText) {
          return;
        }

        const message: ChatMessage = {
          id: `${conversationId}-${Date.now()}`,
          sender,
          sentAt: 'Now',
          text: messageText,
        };

        setConversations((current) => current.map((conversation) => (
          conversation.id === conversationId
            ? { ...conversation, messages: [...conversation.messages, message] }
            : conversation
        )));
      },
    }),
    [conversations],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used inside ChatProvider.');
  }

  return context;
}
