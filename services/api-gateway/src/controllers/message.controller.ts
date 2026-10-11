import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { MessageModel } from '../models/message.model.js';
import type { ChatEventPublisher } from '../realtime/chat-socket.js';

type IdParams = { consultationId?: string };
type MessageBody = { body?: unknown };
type MessageQuery = { cursor?: unknown; limit?: unknown };

function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

function readMessageBody(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const body = value.trim();
  return body.length >= 1 && body.length <= 2_000 ? body : undefined;
}

function readPageOptions(query: MessageQuery) {
  const limit = query.limit === undefined ? 30 : Number(query.limit);
  const cursor = query.cursor;

  if (!Number.isInteger(limit) || limit < 1 || limit > 50) {
    return undefined;
  }

  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length < 1 || cursor.length > 100)) {
    return undefined;
  }

  return { cursor, limit };
}

export function createMessageController(messageModel: MessageModel, chatEvents?: ChatEventPublisher) {
  return {
    list: async (
      request: AuthenticatedRequest & { params: IdParams; query: MessageQuery },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const pageOptions = readPageOptions(request.query);

      if (!consultationId || !pageOptions) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id, a limit from 1 to 50, and an optional valid cursor.');
        return;
      }

      const conversation = await messageModel.findActiveConversation(consultationId, request.authUser!);
      if (!conversation) {
        sendError(response, 404, 'CHAT_NOT_AVAILABLE', 'Chat is available only to the patient and assigned doctor during an active consultation.');
        return;
      }

      const page = await messageModel.listMessages(consultationId, pageOptions);
      if (!page) {
        sendError(response, 400, 'INVALID_CURSOR', 'The message cursor does not belong to this consultation.');
        return;
      }

      response.status(200).json({ data: page });
    },

    send: async (
      request: AuthenticatedRequest & { body: MessageBody; params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const body = readMessageBody(request.body.body);

      if (!consultationId || !body) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id and a message body from 1 to 2000 characters.');
        return;
      }

      const sender = request.authUser!;
      const conversation = await messageModel.findActiveConversation(consultationId, sender);
      if (!conversation || !conversation.doctorId) {
        sendError(response, 404, 'CHAT_NOT_AVAILABLE', 'Chat is available only to the patient and assigned doctor during an active consultation.');
        return;
      }

      const recipientId = sender.role === 'PATIENT' ? conversation.doctorId : conversation.patientId;
      const message = await messageModel.sendMessage({ body, consultationId, sender }, recipientId);

      chatEvents?.publishMessage({
        body: message.body,
        consultationId: message.consultationId,
        createdAt: message.createdAt,
        id: message.id,
        senderId: message.senderId,
        senderRole: message.senderRole,
      });

      response.status(201).json({ data: { message } });
    },
  };
}
