import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import {
  ConsultationModel,
  consultationStatuses,
  type ConsultationStatus,
} from '../models/consultation.model.js';
import { NotificationService } from '../services/notification.service.js';

type CreateConsultationBody = {
  concernTitle?: unknown;
  durationText?: unknown;
  photoUrls?: unknown;
  severity?: unknown;
  symptoms?: unknown;
};

type CompleteConsultationBody = {
  careInstructions?: unknown;
  doctorNotes?: unknown;
  prescriptionUrl?: unknown;
};

type DeclineConsultationBody = { reason?: unknown };

type ListQuery = { limit?: unknown; status?: unknown };
type IdParams = { consultationId?: string };

function sendError(response: Response, status: number, code: string, message: string) {
  response.status(status).json({ error: { code, message } });
}

function readText(value: unknown, minimumLength: number, maximumLength: number) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim();
  return text.length >= minimumLength && text.length <= maximumLength ? text : undefined;
}

function readOptionalText(value: unknown, maximumLength: number) {
  if (value === undefined) {
    return { valid: true as const, value: undefined };
  }

  const text = readText(value, 1, maximumLength);
  return text ? { valid: true as const, value: text } : { valid: false as const };
}

function readOptionalUrl(value: unknown) {
  if (value === undefined) {
    return { valid: true as const, value: undefined };
  }

  if (typeof value !== 'string' || value.length > 2_000) {
    return { valid: false as const };
  }

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:'
      ? { valid: true as const, value: url.toString() }
      : { valid: false as const };
  } catch {
    return { valid: false as const };
  }
}

function readPhotoUrls(value: unknown) {
  if (value === undefined) {
    return { valid: true as const, value: [] };
  }

  if (!Array.isArray(value) || value.length > 5) {
    return { valid: false as const };
  }

  const urls = value.map(readOptionalUrl);
  return urls.every((url) => url.valid && url.value)
    ? { valid: true as const, value: urls.map((url) => url.value!) }
    : { valid: false as const };
}

function readSeverity(value: unknown) {
  if (value === undefined) {
    return { valid: true as const, value: undefined };
  }

  const severity = typeof value === 'string' ? value.trim().toUpperCase() : '';
  return ['MILD', 'MODERATE', 'SEVERE'].includes(severity)
    ? { valid: true as const, value: severity }
    : { valid: false as const };
}

function readListOptions(query: ListQuery) {
  const requestedLimit = typeof query.limit === 'string' ? Number(query.limit) : 20;
  const limit = Number.isInteger(requestedLimit) && requestedLimit >= 1 && requestedLimit <= 50 ? requestedLimit : undefined;
  const status = typeof query.status === 'string' ? query.status.toUpperCase() : undefined;
  const isValidStatus = status === undefined || consultationStatuses.includes(status as ConsultationStatus);

  return limit && isValidStatus ? { valid: true as const, value: { limit, status: status as ConsultationStatus | undefined } } : { valid: false as const };
}

export function createConsultationController(
  consultationModel: ConsultationModel,
  notificationService?: NotificationService,
) {
  return {
    create: async (
      request: AuthenticatedRequest & { body: CreateConsultationBody },
      response: Response,
    ) => {
      const concernTitle = readText(request.body.concernTitle, 3, 160);
      const symptoms = readText(request.body.symptoms, 10, 5_000);
      const durationText = readText(request.body.durationText, 2, 120);
      const severity = readSeverity(request.body.severity);
      const photoUrls = readPhotoUrls(request.body.photoUrls);

      if (!concernTitle || !symptoms || !durationText || !severity.valid || !photoUrls.valid) {
        sendError(
          response,
          400,
          'VALIDATION_ERROR',
          'Provide concernTitle, symptoms, durationText, optional severity (MILD/MODERATE/SEVERE), and up to five valid photoUrls.',
        );
        return;
      }

      const consultation = await consultationModel.create(request.authUser!.id, {
        concernTitle,
        durationText,
        photoUrls: photoUrls.value,
        severity: severity.value,
        symptoms,
      });
      await notificationService?.notifyAvailableDoctors(consultation.id);
      response.status(201).json({ data: { consultation } });
    },

    listMine: async (request: AuthenticatedRequest & { query: ListQuery }, response: Response) => {
      const options = readListOptions(request.query);
      if (!options.valid) {
        sendError(response, 400, 'VALIDATION_ERROR', 'limit must be 1 to 50 and status must be valid.');
        return;
      }

      const consultations = request.authUser!.role === 'PATIENT'
        ? await consultationModel.listForPatient(request.authUser!.id, options.value)
        : await consultationModel.listForDoctor(request.authUser!.id, options.value);
      response.status(200).json({ data: { consultations } });
    },

    listOpen: async (request: AuthenticatedRequest & { query: ListQuery }, response: Response) => {
      const options = readListOptions(request.query);
      if (!options.valid) {
        sendError(response, 400, 'VALIDATION_ERROR', 'limit must be 1 to 50.');
        return;
      }

      const consultations = await consultationModel.listOpenRequests(request.authUser!.id, options.value);
      response.status(200).json({ data: { consultations } });
    },

    getDetails: async (
      request: AuthenticatedRequest & { params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      if (!consultationId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id.');
        return;
      }

      const consultation = request.authUser!.role === 'PATIENT'
        ? await consultationModel.findForPatient(consultationId, request.authUser!.id)
        : await consultationModel.findForDoctor(consultationId, request.authUser!.id);

      if (!consultation) {
        sendError(response, 404, 'CONSULTATION_NOT_FOUND', 'Consultation was not found or is not available to this account.');
        return;
      }

      await notificationService?.notifyUsers([consultation.patientId], {
        body: 'A doctor accepted your consultation. You can now start the chat.',
        consultationId: consultation.id,
        title: 'Consultation accepted',
        type: 'CONSULTATION_ACCEPTED',
      });

      response.status(200).json({ data: { consultation } });
    },

    accept: async (request: AuthenticatedRequest & { params: IdParams }, response: Response) => {
      const consultationId = request.params.consultationId;
      if (!consultationId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id.');
        return;
      }

      if (!(await consultationModel.isDoctorAvailable(request.authUser!.id))) {
        sendError(
          response,
          409,
          'DOCTOR_NOT_AVAILABLE',
          'Create a doctor profile and enable availability before accepting a consultation.',
        );
        return;
      }

      const consultation = await consultationModel.accept(consultationId, request.authUser!.id);
      if (!consultation) {
        sendError(response, 409, 'CONSULTATION_UNAVAILABLE', 'This consultation has already been accepted, cancelled, or completed.');
        return;
      }

      await notificationService?.notifyUsers([consultation.patientId], {
        body: 'Your doctor completed this consultation. Review the care instructions when ready.',
        consultationId: consultation.id,
        title: 'Consultation completed',
        type: 'CONSULTATION_COMPLETED',
      });

      response.status(200).json({ data: { consultation } });
    },

    decline: async (
      request: AuthenticatedRequest & { body: DeclineConsultationBody; params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const reason = readOptionalText(request.body.reason, 500);
      if (!consultationId || !reason.valid) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id and an optional decline reason up to 500 characters.');
        return;
      }

      const declined = await consultationModel.decline(consultationId, request.authUser!.id, reason.value);
      if (!declined) {
        sendError(response, 409, 'CONSULTATION_UNAVAILABLE', 'Only an unassigned pending consultation can be declined.');
        return;
      }

      response.status(200).json({ data: { consultationId, declined: true } });
    },

    complete: async (
      request: AuthenticatedRequest & { body: CompleteConsultationBody; params: IdParams },
      response: Response,
    ) => {
      const consultationId = request.params.consultationId;
      const doctorNotes = readText(request.body.doctorNotes, 10, 4_000);
      const careInstructions = readOptionalText(request.body.careInstructions, 4_000);
      const prescriptionUrl = readOptionalUrl(request.body.prescriptionUrl);

      if (!consultationId || !doctorNotes || !careInstructions.valid || !prescriptionUrl.valid) {
        sendError(
          response,
          400,
          'VALIDATION_ERROR',
          'Provide a consultation id, doctorNotes of at least 10 characters, optional careInstructions, and an optional valid prescriptionUrl.',
        );
        return;
      }

      const consultation = await consultationModel.complete(consultationId, request.authUser!.id, {
        careInstructions: careInstructions.value,
        doctorNotes,
        prescriptionUrl: prescriptionUrl.value,
      });
      if (!consultation) {
        sendError(response, 409, 'CONSULTATION_NOT_ACTIVE', 'Only the assigned doctor can complete an in-progress consultation.');
        return;
      }

      response.status(200).json({ data: { consultation } });
    },

    cancel: async (request: AuthenticatedRequest & { params: IdParams }, response: Response) => {
      const consultationId = request.params.consultationId;
      if (!consultationId) {
        sendError(response, 400, 'VALIDATION_ERROR', 'Provide a consultation id.');
        return;
      }

      const consultation = await consultationModel.cancel(consultationId, request.authUser!.id);
      if (!consultation) {
        sendError(response, 409, 'CONSULTATION_CANNOT_BE_CANCELLED', 'Only a pending consultation can be cancelled by its patient.');
        return;
      }

      response.status(200).json({ data: { consultation } });
    },
  };
}
