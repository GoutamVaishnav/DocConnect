import { getPrismaClient } from '@docconnect/database';

export const consultationStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type ConsultationStatus = (typeof consultationStatuses)[number];

type CreateConsultationInput = {
  concernTitle: string;
  durationText: string;
  photoUrls: string[];
  severity?: string;
  symptoms: string;
};

type CompleteConsultationInput = {
  careInstructions?: string;
  doctorNotes: string;
  prescriptionUrl?: string;
};

type ListOptions = {
  limit: number;
  status?: ConsultationStatus;
};

const consultationDetails = {
  acceptedAt: true,
  attachments: {
    select: {
      bytes: true,
      createdAt: true,
      fileFormat: true,
      id: true,
      kind: true,
      mimeType: true,
      originalFileName: true,
    },
    orderBy: { createdAt: 'asc' },
  },
  careInstructions: true,
  completedAt: true,
  concernTitle: true,
  createdAt: true,
  doctor: {
    select: {
      doctorProfile: {
        select: { fullName: true, specialty: true, verificationStatus: true },
      },
      email: true,
      id: true,
    },
  },
  doctorId: true,
  doctorNotes: true,
  durationText: true,
  id: true,
  patient: {
    select: {
      email: true,
      id: true,
      patientProfile: { select: { fullName: true } },
    },
  },
  patientId: true,
  photoUrls: true,
  prescriptionUrl: true,
  severity: true,
  status: true,
  symptoms: true,
  updatedAt: true,
} as const;

export class ConsultationModel {
  async create(patientId: string, input: CreateConsultationInput) {
    const consultation = await getPrismaClient().consultation.create({
      data: { ...input, patientId },
      select: consultationDetails,
    });

    return consultation;
  }

  async listForPatient(patientId: string, options: ListOptions) {
    return getPrismaClient().consultation.findMany({
      where: { patientId, ...(options.status ? { status: options.status } : {}) },
      orderBy: { createdAt: 'desc' },
      select: consultationDetails,
      take: options.limit,
    });
  }

  async listForDoctor(doctorId: string, options: ListOptions) {
    return getPrismaClient().consultation.findMany({
      where: { doctorId, ...(options.status ? { status: options.status } : {}) },
      orderBy: { createdAt: 'desc' },
      select: consultationDetails,
      take: options.limit,
    });
  }

  async listOpenRequests(doctorId: string, options: ListOptions) {
    return getPrismaClient().consultation.findMany({
      where: {
        declines: { none: { doctorId } },
        doctorId: null,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
      select: consultationDetails,
      take: options.limit,
    });
  }

  async findForPatient(id: string, patientId: string) {
    return getPrismaClient().consultation.findFirst({
      where: { id, patientId },
      select: consultationDetails,
    });
  }

  async findForDoctor(id: string, doctorId: string) {
    return getPrismaClient().consultation.findFirst({
      where: {
        id,
        OR: [
          { doctorId },
          {
            declines: { none: { doctorId } },
            doctorId: null,
            status: 'PENDING',
          },
        ],
      },
      select: consultationDetails,
    });
  }

  async isDoctorAvailable(doctorId: string) {
    const doctorProfile = await getPrismaClient().doctorProfile.findUnique({
      where: { userId: doctorId },
      select: { availabilityEnabled: true },
    });

    return doctorProfile?.availabilityEnabled === true;
  }

  async accept(id: string, doctorId: string) {
    const acceptedAt = new Date();
    const result = await getPrismaClient().consultation.updateMany({
      where: {
        declines: { none: { doctorId } },
        doctorId: null,
        id,
        status: 'PENDING',
      },
      data: { acceptedAt, doctorId, status: 'IN_PROGRESS' },
    });

    return result.count === 1 ? this.findForDoctor(id, doctorId) : undefined;
  }

  async decline(id: string, doctorId: string, reason?: string) {
    const consultation = await getPrismaClient().consultation.findFirst({
      where: { doctorId: null, id, status: 'PENDING' },
      select: { id: true },
    });

    if (!consultation) {
      return false;
    }

    await getPrismaClient().consultationDecline.upsert({
      where: { consultationId_doctorId: { consultationId: id, doctorId } },
      create: { consultationId: id, doctorId, reason },
      update: { reason },
    });

    return true;
  }

  async complete(id: string, doctorId: string, input: CompleteConsultationInput) {
    const completedAt = new Date();
    const result = await getPrismaClient().consultation.updateMany({
      where: { doctorId, id, status: 'IN_PROGRESS' },
      data: { ...input, completedAt, status: 'COMPLETED' },
    });

    return result.count === 1 ? this.findForDoctor(id, doctorId) : undefined;
  }

  async cancel(id: string, patientId: string) {
    const result = await getPrismaClient().consultation.updateMany({
      where: { id, patientId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    return result.count === 1 ? this.findForPatient(id, patientId) : undefined;
  }
}
