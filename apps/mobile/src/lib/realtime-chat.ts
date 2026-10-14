import { io, type Socket } from 'socket.io-client';

import { getRealtimeServerUrl, type ApiConsultationMessage, type ApiNotification } from '@/lib/api';

type JoinChatResult =
  | { ok: true }
  | { message: string; ok: false };

type ServerToClientEvents = {
  'chat:error': (payload: { message: string }) => void;
  'chat:message': (message: ApiConsultationMessage) => void;
  'chat:read': (receipt: { consultationId: string; readAt: string; readerId: string }) => void;
  'chat:typing': (typing: { consultationId: string; isTyping: boolean; userId: string }) => void;
  'notification:new': (notification: ApiNotification) => void;
};

type ClientToServerEvents = {
  'chat:join': (payload: { consultationId: string }, acknowledge: (result: JoinChatResult) => void) => void;
  'chat:leave': (payload: { consultationId: string }) => void;
  'chat:typing': (payload: { consultationId: string; isTyping: boolean }) => void;
};

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function createChatSocket(accessToken: string): ChatSocket {
  return io(getRealtimeServerUrl(), {
    auth: { token: accessToken },
    autoConnect: false,
    reconnection: true,
    transports: ['websocket'],
  });
}
