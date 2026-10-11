import type { Server as HttpServer } from 'node:http';

import { Server, type Socket } from 'socket.io';

import type { AuthenticatedUser } from '../models/otp.model.js';
import { MessageModel } from '../models/message.model.js';
import { TokenModel } from '../models/token.model.js';

export type RealtimeChatMessage = {
  body: string;
  consultationId: string;
  createdAt: Date;
  id: string;
  senderId: string;
  senderRole: 'DOCTOR' | 'PATIENT';
};

type JoinChatResult =
  | { ok: true }
  | { message: string; ok: false };

type ClientToServerEvents = {
  'chat:join': (payload: { consultationId: string }, acknowledge: (result: JoinChatResult) => void) => void;
  'chat:leave': (payload: { consultationId: string }) => void;
};

type ServerToClientEvents = {
  'chat:error': (payload: { message: string }) => void;
  'chat:message': (message: RealtimeChatMessage) => void;
};

type SocketData = {
  user: AuthenticatedUser;
};

export type ChatEventPublisher = {
  publishMessage: (message: RealtimeChatMessage) => void;
};

function consultationRoom(consultationId: string) {
  return `consultation:${consultationId}`;
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
  });

  return {
    publishMessage: (message) => {
      io.to(consultationRoom(message.consultationId)).emit('chat:message', message);
    },
  };
}
