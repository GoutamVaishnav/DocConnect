import { Router } from 'express';

import { createProfileController } from '../controllers/profile.controller.js';
import { createRequireAuthentication, createRequireRole } from '../middlewares/auth.middleware.js';
import { ProfileModel } from '../models/profile.model.js';
import { TokenModel } from '../models/token.model.js';

export function createProfileRouter(jwtAccessSecret: string, jwtAccessExpiresIn: string) {
  const router = Router();
  const requireAuthentication = createRequireAuthentication(new TokenModel(jwtAccessSecret, jwtAccessExpiresIn));
  const requirePatient = createRequireRole('PATIENT');
  const requireDoctor = createRequireRole('DOCTOR');
  const profileController = createProfileController(new ProfileModel());

  router.get('/me', requireAuthentication, profileController.getCurrentProfile);
  router.put('/patient', requireAuthentication, requirePatient, profileController.savePatientProfile);
  router.put('/doctor', requireAuthentication, requireDoctor, profileController.saveDoctorProfile);
  router.patch('/doctor/availability', requireAuthentication, requireDoctor, profileController.setDoctorAvailability);

  return router;
}
