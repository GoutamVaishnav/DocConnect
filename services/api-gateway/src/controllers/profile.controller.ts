import type { Response } from 'express';

import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { ProfileModel } from '../models/profile.model.js';

type PatientProfileBody = { dateOfBirth?: unknown; fullName?: unknown };
type DoctorProfileBody = { fullName?: unknown; registrationNumber?: unknown; specialty?: unknown };
type AvailabilityBody = { enabled?: unknown };

function sendValidationError(response: Response, message: string) {
  response.status(400).json({ error: { code: 'VALIDATION_ERROR', message } });
}

function readRequiredText(value: unknown, fieldName: string, maximumLength: number) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const text = value.trim();
  return text.length >= 2 && text.length <= maximumLength ? text : undefined;
}

function readOptionalText(value: unknown, maximumLength: number) {
  if (value === undefined) {
    return { valid: true as const, value: undefined };
  }

  if (value === null) {
    return { valid: true as const, value: null };
  }

  if (typeof value !== 'string') {
    return { valid: false as const };
  }

  const text = value.trim();
  return text.length > 0 && text.length <= maximumLength
    ? { valid: true as const, value: text }
    : { valid: false as const };
}

function readOptionalDate(value: unknown) {
  if (value === undefined) {
    return { valid: true as const, value: undefined };
  }

  if (value === null) {
    return { valid: true as const, value: null };
  }

  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { valid: false as const };
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  const isRealPastDate = date.toISOString().slice(0, 10) === value && date < new Date();
  return isRealPastDate ? { valid: true as const, value: date } : { valid: false as const };
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export function createProfileController(profileModel: ProfileModel) {
  return {
    getCurrentProfile: async (request: AuthenticatedRequest, response: Response) => {
      const profile = request.authUser ? await profileModel.findByUserId(request.authUser.id) : undefined;

      if (!profile) {
        response.status(401).json({
          error: { code: 'UNAUTHORIZED', message: 'The authenticated user no longer exists.' },
        });
        return;
      }

      response.status(200).json({ data: { profile } });
    },

    savePatientProfile: async (
      request: AuthenticatedRequest & { body: PatientProfileBody },
      response: Response,
    ) => {
      const fullName = readRequiredText(request.body.fullName, 'fullName', 120);
      const dateOfBirth = readOptionalDate(request.body.dateOfBirth);

      if (!fullName || !dateOfBirth.valid) {
        sendValidationError(response, 'Provide a fullName and an optional valid past dateOfBirth (YYYY-MM-DD).');
        return;
      }

      const profile = await profileModel.savePatientProfile(request.authUser!.id, {
        dateOfBirth: dateOfBirth.value,
        fullName,
      });
      response.status(200).json({ data: { profile } });
    },

    saveDoctorProfile: async (
      request: AuthenticatedRequest & { body: DoctorProfileBody },
      response: Response,
    ) => {
      const fullName = readRequiredText(request.body.fullName, 'fullName', 120);
      const specialty = readRequiredText(request.body.specialty, 'specialty', 100);
      const registrationNumber = readOptionalText(request.body.registrationNumber, 60);

      if (!fullName || !specialty || !registrationNumber.valid) {
        sendValidationError(response, 'Provide fullName, specialty, and an optional registrationNumber up to 60 characters.');
        return;
      }

      try {
        const profile = await profileModel.saveDoctorProfile(request.authUser!.id, {
          fullName,
          registrationNumber: registrationNumber.value,
          specialty,
        });
        response.status(200).json({ data: { profile } });
      } catch (error) {
        if (isUniqueConstraintError(error)) {
          response.status(409).json({
            error: {
              code: 'REGISTRATION_NUMBER_EXISTS',
              message: 'This medical registration number is already in use.',
            },
          });
          return;
        }

        throw error;
      }
    },

    setDoctorAvailability: async (
      request: AuthenticatedRequest & { body: AvailabilityBody },
      response: Response,
    ) => {
      if (typeof request.body.enabled !== 'boolean') {
        sendValidationError(response, 'Provide enabled as true or false.');
        return;
      }

      const profile = await profileModel.setDoctorAvailability(request.authUser!.id, request.body.enabled);
      if (!profile) {
        response.status(409).json({
          error: {
            code: 'DOCTOR_PROFILE_REQUIRED',
            message: 'Create the doctor profile before changing availability.',
          },
        });
        return;
      }

      response.status(200).json({ data: { profile } });
    },
  };
}
