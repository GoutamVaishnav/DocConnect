import type { Response } from 'express';

import { isCloudinaryConfigured } from '../config/cloudinary.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { chatAttachmentKindForMimeType, MessageAttachmentModel } from '../models/message-attachment.model.js';
import { MessageModel } from '../models/message.model.js';
import type { ChatEventPublisher } from '../realtime/chat-socket.js';
import { NotificationService } from '../services/notification.service.js';

type IdParams = { consultationId?: string };
type MessageBody = { body?: unknown };
type MessageQuery = { cursor?: unknown; limit?: unknown };

type StoredMessage = {
  attachments: Array<{
    bytes: number;
    cloudinaryPublicId: string;
    createdAt: Date;
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

function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

function readMessageBody(value: unknown) {
  if (value === undefined || value === null) {
    return '';
  }

  if (typeof value !== 'string') {
    return undefined;
  }

  const body = value.trim();
  return body.length <= 2_000 ? body : undefined;
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

function toPublicMessage(message: StoredMessage, attachmentModel: MessageAttachmentModel) {
  return {
    ...message,
    attachments: message.attachments.map(({ cloudinaryPublicId, fileFormat, kind, ...attachment }) => ({
      ...attachment,
      deliveryUrl: attachmentModel.createDeliveryUrl(cloudinaryPublicId, fileFormat, kind)?.url ?? null,
      fileFormat,
      kind,
    })),
  };
}

export function createMessageController(
  messageModel: MessageModel,
  attachmentModel: MessageAttachmentModel,
  chatEvents?: ChatEventPublisher,
  notificationService?: NotificationService,
) {
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

      response.status(200).json({
        data: {
          ...page,
          messages: page.messages.map((message) => toPublicMessage(message, attachmentModel)),
        },
      });
    },

    send: async (
      request: AuthenticatedRequest & { body: MessageBody; file?: Express.Multer.File; params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const body = readMessageBody(request.body.body);
      const file = request.file;
      const attachmentKind = file ? chatAttachmentKindForMimeType(file.mimetype) : undefined;

      if (!consultationId || body === undefined || (!body && !file)) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a message from 1 to 2000 characters, an attachment, or both.');
        return;
      }

      if (file && !attachmentKind) {
        sendError(response, 400, 'UNSUPPORTED_ATTACHMENT_TYPE', 'Only JPEG, PNG, WebP, PDF, DOC, DOCX, and text files are allowed.');
        return;
      }

      if (file && !isCloudinaryConfigured()) {
        sendError(response, 503, 'UPLOADS_NOT_CONFIGURED', 'Cloudinary is not configured on the API gateway.');
        return;
      }

      const sender = request.authUser!;
      const conversation = await messageModel.findActiveConversation(consultationId, sender);
      if (!conversation || !conversation.doctorId) {
        sendError(response, 404, 'CHAT_NOT_AVAILABLE', 'Chat is available only to the patient and assigned doctor during an active consultation.');
        return;
      }

      const recipientId = sender.role === 'PATIENT' ? conversation.doctorId : conversation.patientId;
      let uploaded: { kind: NonNullable<typeof attachmentKind>; publicId: string } | undefined;
      let messageWasSaved = false;

      try {
        const uploadedAttachment = file && attachmentKind
          ? await attachmentModel.upload(file, consultationId, attachmentKind)
          : undefined;
        const attachment = file && attachmentKind && uploadedAttachment
          ? attachmentModel.toStoredAttachment(file, uploadedAttachment, attachmentKind)
          : undefined;

        if (attachment) {
          uploaded = { kind: attachment.kind, publicId: attachment.cloudinaryPublicId };
        }

        const result = await messageModel.sendMessage({
          attachment,
          body,
          consultationId,
          sender,
        }, recipientId);
        messageWasSaved = true;

        const message = toPublicMessage(result.message, attachmentModel);
        chatEvents?.publishMessage(message);
        await notificationService?.deliver(result.notification);

        response.status(201).json({ data: { message } });
      } catch (error) {
        if (uploaded && !messageWasSaved) {
          try {
            await attachmentModel.remove(uploaded.publicId, uploaded.kind);
          } catch (cleanupError) {
            console.error('Chat attachment cleanup failed:', cleanupError);
          }
        }

        console.error('Chat message delivery failed:', error);
        sendError(response, 502, 'MESSAGE_SEND_FAILED', 'The message could not be sent. Please try again.');
      }
    },

    markRead: async (
      request: AuthenticatedRequest & { params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      if (!consultationId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id.');
        return;
      }

      const reader = request.authUser!;
      const conversation = await messageModel.findActiveConversation(consultationId, reader);
      if (!conversation) {
        sendError(response, 404, 'CHAT_NOT_AVAILABLE', 'Chat is available only to the patient and assigned doctor during an active consultation.');
        return;
      }

      const receipt = await messageModel.markIncomingMessagesRead(consultationId, reader.id);
      if (receipt.updatedCount > 0) {
        chatEvents?.publishReadReceipt({
          consultationId,
          readAt: receipt.readAt,
          readerId: reader.id,
        });
      }

      response.status(200).json({
        data: {
          readAt: receipt.updatedCount > 0 ? receipt.readAt : null,
          updatedCount: receipt.updatedCount,
        },
      });
    },
  };
}
