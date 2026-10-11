import { getPrismaClient } from '@docconnect/database';

type PatientProfileInput = {
  dateOfBirth?: Date | null;
  fullName: string;
};

type DoctorProfileInput = {
  fullName: string;
  registrationNumber?: string | null;
  specialty: string;
};

export class ProfileModel {
  async findByUserId(userId: string) {
    return getPrismaClient().user.findUnique({
      where: { id: userId },
      select: {
        doctorProfile: {
          select: {
            availabilityEnabled: true,
            fullName: true,
            registrationNumber: true,
            specialty: true,
            verificationStatus: true,
          },
        },
        email: true,
        emailVerifiedAt: true,
        id: true,
        patientProfile: {
          select: { dateOfBirth: true, fullName: true },
        },
        role: true,
      },
    });
  }

  async savePatientProfile(userId: string, input: PatientProfileInput) {
    const patientProfile = getPrismaClient().patientProfile;

    await patientProfile.upsert({
      where: { userId },
      create: {
        dateOfBirth: input.dateOfBirth ?? null,
        fullName: input.fullName,
        userId,
      },
      update: {
        ...(input.dateOfBirth === undefined ? {} : { dateOfBirth: input.dateOfBirth }),
        fullName: input.fullName,
      },
    });

    return this.findByUserId(userId);
  }

  async saveDoctorProfile(userId: string, input: DoctorProfileInput) {
    const doctorProfile = getPrismaClient().doctorProfile;

    await doctorProfile.upsert({
      where: { userId },
      create: {
        fullName: input.fullName,
        registrationNumber: input.registrationNumber ?? null,
        specialty: input.specialty,
        userId,
      },
      update: {
        fullName: input.fullName,
        ...(input.registrationNumber === undefined ? {} : { registrationNumber: input.registrationNumber }),
        specialty: input.specialty,
      },
    });

    return this.findByUserId(userId);
  }

  async setDoctorAvailability(userId: string, enabled: boolean) {
    const doctorProfile = getPrismaClient().doctorProfile;
    const existingProfile = await doctorProfile.findUnique({ where: { userId } });

    if (!existingProfile) {
      return undefined;
    }

    await doctorProfile.update({
      where: { userId },
      data: { availabilityEnabled: enabled },
    });

    return this.findByUserId(userId);
  }
}
