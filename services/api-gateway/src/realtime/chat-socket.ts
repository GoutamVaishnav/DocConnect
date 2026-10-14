import type { Server as HttpServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import type { AuthenticatedUser } from '../models/otp.model.js';
import { MessageModel } from '../models/message.model.js';
import { TokenModel } from '../models/token.model.js';

export type RealtimeChatMessage = {
  attachments: Array<{
    bytes: number;
    createdAt: Date;
    deliveryUrl: string | null;
    fileFormat: string;
    id: string;
    kind: 'IMAGE' | 'FILE';
    mimeType: string;
    originalFileName: string;
  }>;
  body: string;
  consultationId: string;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  senderId: string;
  senderRole: 'DOCTOR' | 'PATIENT';
};

export type RealtimeChatReadReceipt = {
  consultationId: string;
  readAt: Date;
  readerId: string;
};

export type RealtimeChatTyping = {
  consultationId: string;
  isTyping: boolean;
  userId: string;
};

export type RealtimeNotification = {
  body: string;
  consultationId: string | null;
  createdAt: Date;
  id: string;
  readAt: Date | null;
  title: string;
  type: 'CONSULTATION_REQUEST' | 'CONSULTATION_ACCEPTED' | 'CONSULTATION_COMPLETED' | 'CHAT_MESSAGE';
};

type JoinChatResult =
  | { ok: true }
  | { message: string; ok: false };

type ClientToServerEvents = {
  'chat:join': (payload: { consultationId: string }, acknowledge: (result: JoinChatResult) => void) => void;
  'chat:leave': (payload: { consultationId: string }) => void;
  'chat:typing': (payload: { consultationId: string; isTyping: boolean }) => void;
};

type ServerToClientEvents = {
  'chat:error': (payload: { message: string }) => void;
  'chat:message': (message: RealtimeChatMessage) => void;
  'chat:read': (receipt: RealtimeChatReadReceipt) => void;
  'chat:typing': (typing: RealtimeChatTyping) => void;
  'notification:new': (notification: RealtimeNotification) => void;
};

type SocketData = {
  user: AuthenticatedUser;
};

export type ChatEventPublisher = {
  publishMessage: (message: RealtimeChatMessage) => void;
  publishNotification: (notification: RealtimeNotification & { userId: string }) => void;
  publishReadReceipt: (receipt: RealtimeChatReadReceipt) => void;
};

function consultationRoom(consultationId: string) {
  return `consultation:${consultationId}`;
}

function userRoom(userId: string) {
  return `user:${userId}`;
}

function readConsultationId(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f-]{36}$/i.test(value) ? value : undefined;
}

function readHandshakeToken(socket: Socket<ClientToServerEvents, ServerToClientEvents, object, SocketData>) {
  const token = socket.handshake.auth.token;
  return typeof token === 'string' ? token : undefined;
}

export function createChatSocketServer(
  httpServer: HttpServer,
  input: { corsOrigin: string[] | true; jwtAccessExpiresIn: string; jwtAccessSecret: string },
): ChatEventPublisher {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, object, SocketData>(httpServer, {
    cors: {
      methods: ['GET', 'POST'],
      origin: input.corsOrigin,
    },
  });
  const tokenModel = new TokenModel(input.jwtAccessSecret, input.jwtAccessExpiresIn);
  const messageModel = new MessageModel();

  io.use((socket, next) => {
    const token = readHandshakeToken(socket);
    const user = token ? tokenModel.readAccessToken(token) : undefined;

    if (!user) {
      next(new Error('UNAUTHORIZED'));
      return;
    }

    socket.data.user = user;
    next();
  });

  io.on('connection', (socket) => {
    void socket.join(userRoom(socket.data.user.id));

    socket.on('chat:join', async (payload, acknowledge) => {
      const consultationId = readConsultationId(payload?.consultationId);
      if (!consultationId) {
        acknowledge({ message: 'Invalid consultation id.', ok: false });
        return;
      }

      try {
        const conversation = await messageModel.findActiveConversation(consultationId, socket.data.user);
        if (!conversation) {
          acknowledge({ message: 'You cannot join this consultation chat.', ok: false });
          return;
        }

        await socket.join(consultationRoom(consultationId));
        acknowledge({ ok: true });
      } catch {
        acknowledge({ message: 'Could not open the live chat connection.', ok: false });
      }
    });

    socket.on('chat:leave', (payload) => {
      const consultationId = readConsultationId(payload?.consultationId);
      if (consultationId) {
        void socket.leave(consultationRoom(consultationId));
      }
    });

    socket.on('chat:typing', async (payload) => {
      const consultationId = readConsultationId(payload?.consultationId);
      if (!consultationId || typeof payload?.isTyping !== 'boolean') {
        return;
      }

      try {
        const conversation = await messageModel.findActiveConversation(consultationId, socket.data.user);
        if (!conversation) {
          return;
        }

        socket.to(consultationRoom(consultationId)).emit('chat:typing', {
          consultationId,
          isTyping: payload.isTyping,
          userId: socket.data.user.id,
        });
      } catch {
        // Typing is an optional, ephemeral signal. It should never interrupt chat.
      }
    });
  });

  return {
    publishMessage: (message) => {
      io.to(consultationRoom(message.consultationId)).emit('chat:message', message);
    },
    publishNotification: (notification) => {
      const { userId, ...payload } = notification;
      io.to(userRoom(userId)).emit('notification:new', payload);
    },
    publishReadReceipt: (receipt) => {
      io.to(consultationRoom(receipt.consultationId)).emit('chat:read', receipt);
    },
  };
}
