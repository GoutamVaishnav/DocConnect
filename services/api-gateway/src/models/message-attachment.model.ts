import { randomUUID } from 'node:crypto';

import type { UploadApiResponse } from 'cloudinary';

import { getCloudinaryClient } from '../config/cloudinary.js';

const imageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const documentMimeTypes = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export const maxChatAttachmentBytes = 10 * 1024 * 1024;

export type ChatAttachmentKind = 'IMAGE' | 'FILE';

export type StoredChatAttachment = {
  bytes: number;
  cloudinaryPublicId: string;
  fileFormat: string;
  kind: ChatAttachmentKind;
  mimeType: string;
  originalFileName: string;
};

export function chatAttachmentKindForMimeType(mimeType: string): ChatAttachmentKind | undefined {
  if (imageMimeTypes.has(mimeType)) {
    return 'IMAGE';
  }

  return documentMimeTypes.has(mimeType) ? 'FILE' : undefined;
}

function safeFileName(fileName: string) {
  const compactName = fileName.replace(/[\\/]/g, '-').trim();
  return (compactName || 'chat-attachment').slice(0, 200);
}

export class MessageAttachmentModel {
  async upload(file: Express.Multer.File, consultationId: string, kind: ChatAttachmentKind) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      throw new Error('Cloudinary is not configured.');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `docconnect/chat/${consultationId}`,
          overwrite: false,
          public_id: randomUUID(),
          resource_type: kind === 'IMAGE' ? 'image' : 'raw',
          type: 'authenticated',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary did not return an upload result.'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  toStoredAttachment(file: Express.Multer.File, uploaded: UploadApiResponse, kind: ChatAttachmentKind): StoredChatAttachment {
    return {
      bytes: uploaded.bytes,
      cloudinaryPublicId: uploaded.public_id,
      fileFormat: uploaded.format || file.originalname.split('.').pop()?.toLowerCase() || 'file',
      kind,
      mimeType: file.mimetype,
      originalFileName: safeFileName(file.originalname),
    };
  }

  async remove(publicId: string, kind: ChatAttachmentKind) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      return;
    }

    await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: kind === 'IMAGE' ? 'image' : 'raw',
      type: 'authenticated',
    });
  }

  createDeliveryUrl(publicId: string, fileFormat: string, kind: ChatAttachmentKind) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      return undefined;
    }

    const expiresAt = Math.floor(Date.now() / 1_000) + 5 * 60;
    const url = cloudinary.utils.private_download_url(publicId, fileFormat, {
      expires_at: expiresAt,
      resource_type: kind === 'IMAGE' ? 'image' : 'raw',
      type: 'authenticated',
    });

    return { expiresAt: new Date(expiresAt * 1_000).toISOString(), url };
  }
}
