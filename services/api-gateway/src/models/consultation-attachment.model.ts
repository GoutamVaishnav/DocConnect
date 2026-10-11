import { randomUUID } from 'node:crypto';

import { getPrismaClient } from '@docconnect/database';
import type { UploadApiResponse } from 'cloudinary';

import { getCloudinaryClient } from '../config/cloudinary.js';

const permittedImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const maxConsultationImages = 5;

export function isPermittedConsultationImage(mimeType: string) {
  return permittedImageMimeTypes.has(mimeType);
}

const attachmentSelect = {
  bytes: true,
  cloudinaryPublicId: true,
  consultationId: true,
  createdAt: true,
  fileFormat: true,
  id: true,
  kind: true,
  mimeType: true,
  originalFileName: true,
} as const;

type StoredImageInput = {
  bytes: number;
  cloudinaryPublicId: string;
  consultationId: string;
  fileFormat: string;
  mimeType: string;
  originalFileName: string;
  uploadedById: string;
};

function safeOriginalFileName(fileName: string) {
  const compactName = fileName.replace(/[\\/]/g, '-').trim();
  return (compactName || 'consultation-image').slice(0, 200);
}

export class ConsultationAttachmentModel {
  async findPatientUploadTarget(consultationId: string, patientId: string) {
    return getPrismaClient().consultation.findFirst({
      where: {
        id: consultationId,
        patientId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      select: {
        _count: { select: { attachments: { where: { kind: 'PATIENT_IMAGE' } } } },
        id: true,
      },
    });
  }

  async uploadPatientImage(file: Express.Multer.File, consultationId: string) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      throw new Error('Cloudinary is not configured.');
    }

    return new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `docconnect/consultations/${consultationId}`,
          overwrite: false,
          public_id: randomUUID(),
          resource_type: 'image',
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

  async createPatientImage(input: StoredImageInput) {
    return getPrismaClient().consultationAttachment.create({
      data: {
        ...input,
        kind: 'PATIENT_IMAGE',
        originalFileName: safeOriginalFileName(input.originalFileName),
      },
      select: attachmentSelect,
    });
  }

  async removeCloudinaryImage(cloudinaryPublicId: string) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      return;
    }

    await cloudinary.uploader.destroy(cloudinaryPublicId, {
      invalidate: true,
      resource_type: 'image',
      type: 'authenticated',
    });
  }

  async findAccessibleImage(consultationId: string, attachmentId: string, user: { id: string; role: 'DOCTOR' | 'PATIENT' }) {
    const doctorCanViewOpenRequest = {
      declines: { none: { doctorId: user.id } },
      doctorId: null,
      status: 'PENDING' as const,
    };

    return getPrismaClient().consultation.findFirst({
      where: user.role === 'PATIENT'
        ? { id: consultationId, patientId: user.id }
        : {
          id: consultationId,
          OR: [{ doctorId: user.id }, doctorCanViewOpenRequest],
        },
      select: {
        attachments: {
          select: attachmentSelect,
          where: { id: attachmentId, kind: 'PATIENT_IMAGE' },
        },
      },
    });
  }

  async findPatientRemovableImage(consultationId: string, attachmentId: string, patientId: string) {
    return getPrismaClient().consultation.findFirst({
      where: {
        id: consultationId,
        patientId,
        status: 'PENDING',
      },
      select: {
        attachments: {
          select: attachmentSelect,
          where: { id: attachmentId, kind: 'PATIENT_IMAGE' },
        },
      },
    });
  }

  async deletePatientImageRecord(attachmentId: string) {
    await getPrismaClient().consultationAttachment.delete({ where: { id: attachmentId } });
  }

  createShortLivedDeliveryUrl(publicId: string, format: string) {
    const cloudinary = getCloudinaryClient();
    if (!cloudinary) {
      return undefined;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;
    const url = cloudinary.utils.private_download_url(publicId, format, {
      expires_at: expiresAt,
      resource_type: 'image',
      type: 'authenticated',
    });

    return { expiresAt: new Date(expiresAt * 1_000).toISOString(), url };
  }
}
