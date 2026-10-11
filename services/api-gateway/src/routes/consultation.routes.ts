import { Router } from 'express';

import { createConsultationController } from '../controllers/consultation.controller.js';
import { createMessageController } from '../controllers/message.controller.js';
import { createUploadController } from '../controllers/upload.controller.js';
import { createRequireAuthentication, createRequireRole } from '../middlewares/auth.middleware.js';
import { consultationImageUpload } from '../middlewares/upload.middleware.js';
import { ConsultationAttachmentModel } from '../models/consultation-attachment.model.js';
import { ConsultationModel } from '../models/consultation.model.js';
import { MessageModel } from '../models/message.model.js';
import { TokenModel } from '../models/token.model.js';

export function createConsultationRouter(jwtAccessSecret: string, jwtAccessExpiresIn: string) {
  const router = Router();
  const requireAuthentication = createRequireAuthentication(new TokenModel(jwtAccessSecret, jwtAccessExpiresIn));
  const requirePatient = createRequireRole('PATIENT');
  const requireDoctor = createRequireRole('DOCTOR');
  const consultationController = createConsultationController(new ConsultationModel());
  const messageController = createMessageController(new MessageModel());
  const uploadController = createUploadController(new ConsultationAttachmentModel());

  router.post('/', requireAuthentication, requirePatient, consultationController.create);
  router.get('/my', requireAuthentication, consultationController.listMine);
  router.get('/open', requireAuthentication, requireDoctor, consultationController.listOpen);
  router.get('/:consultationId/messages', requireAuthentication, messageController.list);
  router.post('/:consultationId/messages', requireAuthentication, messageController.send);
  router.get('/:consultationId', requireAuthentication, consultationController.getDetails);
  router.post(
    '/:consultationId/images',
    requireAuthentication,
    requirePatient,
    consultationImageUpload,
    uploadController.uploadImage,
  );
  router.get('/:consultationId/images/:attachmentId/delivery-url', requireAuthentication, uploadController.getImageDeliveryUrl);
  router.delete(
    '/:consultationId/images/:attachmentId',
    requireAuthentication,
    requirePatient,
    uploadController.deleteImage,
  );
  router.patch('/:consultationId/accept', requireAuthentication, requireDoctor, consultationController.accept);
  router.patch('/:consultationId/decline', requireAuthentication, requireDoctor, consultationController.decline);
  router.patch('/:consultationId/complete', requireAuthentication, requireDoctor, consultationController.complete);
  router.patch('/:consultationId/cancel', requireAuthentication, requirePatient, consultationController.cancel);

  return router;
}
