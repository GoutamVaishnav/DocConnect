import type { Response } from 'express';

import { isCloudinaryConfigured } from '../config/cloudinary.js';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import {
  ConsultationAttachmentModel,
  isPermittedConsultationImage,
  maxConsultationImages,
} from '../models/consultation-attachment.model.js';

type ImageParams = { attachmentId?: string; consultationId?: string };

function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

export function createUploadController(attachmentModel: ConsultationAttachmentModel) {
  return {
    uploadImage: async (
      request: AuthenticatedRequest & { params: ImageParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const image = request.file;

      if (!consultationId || !image) {
        sendError(response, 400, 'UPLOAD_VALIDATION_ERROR', 'Send one image file using the image form field.');
        return;
      }

      if (!isPermittedConsultationImage(image.mimetype)) {
        sendError(response, 400, 'UNSUPPORTED_IMAGE_TYPE', 'Only JPEG, PNG, and WebP images are allowed.');
        return;
      }

      if (!isCloudinaryConfigured()) {
        sendError(response, 503, 'UPLOADS_NOT_CONFIGURED', 'Cloudinary is not configured on the API gateway.');
        return;
      }

      const consultation = await attachmentModel.findPatientUploadTarget(consultationId, request.authUser!.id);
      if (!consultation) {
        sendError(response, 404, 'CONSULTATION_NOT_FOUND', 'Consultation was not found or cannot accept images.');
        return;
      }

      if (consultation._count.attachments >= maxConsultationImages) {
        sendError(response, 409, 'IMAGE_LIMIT_REACHED', `A consultation can have at most ${maxConsultationImages} images.`);
        return;
      }

      try {
        const uploadedImage = await attachmentModel.uploadPatientImage(image, consultationId);
        let attachment;

        try {
          attachment = await attachmentModel.createPatientImage({
            bytes: uploadedImage.bytes,
            cloudinaryPublicId: uploadedImage.public_id,
            consultationId,
            fileFormat: uploadedImage.format,
            mimeType: image.mimetype,
            originalFileName: image.originalname,
            uploadedById: request.authUser!.id,
          });
        } catch (error) {
          // If the database write fails after Cloudinary succeeds, remove the
          // remote file so an untracked patient image is not left behind.
          try {
            await attachmentModel.removeCloudinaryImage(uploadedImage.public_id);
          } catch (cleanupError) {
            console.error('Cloudinary image cleanup failed:', cleanupError);
          }
          throw error;
        }

        response.status(201).json({
          data: { attachment: { ...attachment, cloudinaryPublicId: undefined } },
        });
      } catch (error) {
        console.error('Consultation image upload failed:', error);
        sendError(response, 502, 'IMAGE_UPLOAD_FAILED', 'The image could not be uploaded. Please try again.');
      }
    },

    getImageDeliveryUrl: async (
      request: AuthenticatedRequest & { params: ImageParams },
      response: Response,
    ) => {
      const { attachmentId, consultationId } = request.params;
      if (!consultationId || !attachmentId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id and image attachment id.');
        return;
      }

      if (!isCloudinaryConfigured()) {
        sendError(response, 503, 'UPLOADS_NOT_CONFIGURED', 'Cloudinary is not configured on the API gateway.');
        return;
      }

      const consultation = await attachmentModel.findAccessibleImage(consultationId, attachmentId, request.authUser!);
      const attachment = consultation?.attachments[0];
      if (!attachment) {
        sendError(response, 404, 'IMAGE_NOT_FOUND', 'Image was not found or is not available to this account.');
        return;
      }

      const delivery = attachmentModel.createShortLivedDeliveryUrl(attachment.cloudinaryPublicId, attachment.fileFormat);
      if (!delivery) {
        sendError(response, 503, 'UPLOADS_NOT_CONFIGURED', 'Cloudinary is not configured on the API gateway.');
        return;
      }

      response.status(200).json({ data: { attachment: { ...attachment, cloudinaryPublicId: undefined }, delivery } });
    },

    deleteImage: async (
      request: AuthenticatedRequest & { params: ImageParams },
      response: Response,
    ) => {
      const { attachmentId, consultationId } = request.params;
      if (!consultationId || !attachmentId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id and image attachment id.');
        return;
      }

      if (!isCloudinaryConfigured()) {
        sendError(response, 503, 'UPLOADS_NOT_CONFIGURED', 'Cloudinary is not configured on the API gateway.');
        return;
      }

      const consultation = await attachmentModel.findPatientRemovableImage(
        consultationId,
        attachmentId,
        request.authUser!.id,
      );
      const attachment = consultation?.attachments[0];
      if (!attachment) {
        sendError(response, 404, 'IMAGE_NOT_FOUND', 'Only a pending consultation image owned by this patient can be removed.');
        return;
      }

      try {
        await attachmentModel.removeCloudinaryImage(attachment.cloudinaryPublicId);
        await attachmentModel.deletePatientImageRecord(attachment.id);
        response.status(204).send();
      } catch (error) {
        console.error('Consultation image deletion failed:', error);
        sendError(response, 502, 'IMAGE_DELETE_FAILED', 'The image could not be removed. Please try again.');
      }
    },
  };
}
