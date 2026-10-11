import { Platform } from 'react-native';

export type AppUserRole = 'DOCTOR' | 'PATIENT';

export type AuthenticatedUser = {
  email: string;
  id: string;
  role: AppUserRole;
};

export type ApiDoctorProfile = {
  availabilityEnabled: boolean;
  fullName: string;
  registrationNumber: string | null;
  specialty: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
};

export type ApiListedDoctor = {
  availabilityEnabled: boolean;
  fullName: string;
  id: string;
  specialty: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
};

export type ApiProfile = {
  doctorProfile: ApiDoctorProfile | null;
  email: string;
  emailVerifiedAt: string | null;
  id: string;
  patientProfile: {
    dateOfBirth: string | null;
    fullName: string;
  } | null;
  role: AppUserRole;
};

type GatewayErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

type GatewaySuccess<T> = { data: T };

type RequestOtpResponse = {
  delivery: 'development' | 'smtp';
  developmentCode?: string;
  email: string;
  expiresInSeconds: number;
  message: string;
  role: AppUserRole;
};

type VerifyOtpResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
};

export type ApiConsultationStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type ConsultationAttachment = {
  bytes: number;
  createdAt: string;
  fileFormat: string;
  id: string;
  kind: 'PATIENT_IMAGE';
  mimeType: string;
  originalFileName: string;
};

export type ApiConsultation = {
  acceptedAt: string | null;
  attachments: ConsultationAttachment[];
  careInstructions: string | null;
  completedAt: string | null;
  concernTitle: string;
  createdAt: string;
  doctor: {
    doctorProfile: {
      fullName: string;
      specialty: string;
      verificationStatus: string;
    } | null;
    email: string;
    id: string;
  } | null;
  doctorId: string | null;
  doctorNotes: string | null;
  durationText: string;
  id: string;
  patientId: string;
  patient: {
    email: string;
    id: string;
    patientProfile: {
      fullName: string;
    } | null;
  };
  photoUrls: string[];
  prescriptionUrl: string | null;
  severity: string | null;
  status: ApiConsultationStatus;
  symptoms: string;
  updatedAt: string;
};

export type ConsultationPhotoUpload = {
  fileName: string;
  mimeType?: string | null;
  uri: string;
};

export type ApiConsultationMessage = {
  body: string;
  consultationId: string;
  createdAt: string;
  id: string;
  senderId: string;
  senderRole: AppUserRole;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// This value is public on purpose: it is only the gateway address, never a key
// or a secret. For a real phone use the computer's LAN IPv4 address, not localhost.
const configuredApiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, '');

function getApiBaseUrl() {
  if (!configuredApiBaseUrl) {
    throw new ApiError(
      'API address is not configured. Add EXPO_PUBLIC_API_BASE_URL to apps/mobile/.env.',
      'API_NOT_CONFIGURED',
    );
  }

  return configuredApiBaseUrl;
}

async function request<T>(
  path: string,
  options: RequestInit & { accessToken?: string } = {},
) {
  const { accessToken, headers, ...fetchOptions } = options;
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...fetchOptions,
      headers: {
        Accept: 'application/json',
        ...(typeof fetchOptions.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(
      'Could not reach DocConnect API. Start the gateway and check EXPO_PUBLIC_API_BASE_URL.',
      'NETWORK_ERROR',
    );
  }

  const payload = await response.json().catch(() => undefined) as GatewaySuccess<T> | GatewayErrorBody | undefined;

  if (!response.ok) {
    const gatewayError = payload as GatewayErrorBody | undefined;
    throw new ApiError(
      gatewayError?.error?.message || 'The server could not complete this request.',
      gatewayError?.error?.code || 'REQUEST_FAILED',
      response.status,
    );
  }

  const success = payload as GatewaySuccess<T> | undefined;
  if (!success?.data) {
    throw new ApiError('The server returned an invalid response.', 'INVALID_RESPONSE', response.status);
  }

  return success.data;
}

export const authApi = {
  requestEmailOtp(email: string, role: AppUserRole) {
    return request<RequestOtpResponse>('/api/v1/auth/email-otp/request', {
      body: JSON.stringify({ email, role }),
      method: 'POST',
    });
  },

  verifyEmailOtp(email: string, role: AppUserRole, code: string) {
    return request<VerifyOtpResponse>('/api/v1/auth/email-otp/verify', {
      body: JSON.stringify({ code, email, role }),
      method: 'POST',
    });
  },

  getCurrentUser(accessToken: string) {
    return request<{ user: AuthenticatedUser }>('/api/v1/auth/me', { accessToken });
  },
};

export const profileApi = {
  listDoctors(accessToken: string) {
    return request<{ doctors: ApiListedDoctor[] }>('/api/v1/profile/doctors', { accessToken });
  },

  getCurrentProfile(accessToken: string) {
    return request<{ profile: ApiProfile }>('/api/v1/profile/me', { accessToken });
  },

  savePatientProfile(accessToken: string, fullName: string) {
    return request('/api/v1/profile/patient', {
      accessToken,
      body: JSON.stringify({ fullName }),
      method: 'PUT',
    });
  },

  saveDoctorProfile(accessToken: string, input: { fullName: string; registrationNumber?: string; specialty: string }) {
    return request<{ profile: ApiProfile }>('/api/v1/profile/doctor', {
      accessToken,
      body: JSON.stringify(input),
      method: 'PUT',
    });
  },

  setDoctorAvailability(accessToken: string, enabled: boolean) {
    return request<{ profile: ApiProfile }>('/api/v1/profile/doctor/availability', {
      accessToken,
      body: JSON.stringify({ enabled }),
      method: 'PATCH',
    });
  },
};

function inferImageMimeType(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();

  if (extension === 'png') {
    return 'image/png';
  }

  if (extension === 'webp') {
    return 'image/webp';
  }

  return 'image/jpeg';
}

async function createImageFormData(photo: ConsultationPhotoUpload) {
  const formData = new FormData();
  const fileName = photo.fileName || 'consultation-image.jpg';
  const mimeType = photo.mimeType || inferImageMimeType(fileName);

  if (Platform.OS === 'web') {
    const imageResponse = await fetch(photo.uri);
    const imageBlob = await imageResponse.blob();
    formData.append('image', imageBlob, fileName);
  } else {
    formData.append('image', { name: fileName, type: mimeType, uri: photo.uri } as unknown as Blob);
  }

  return formData;
}

export const consultationApi = {
  create(
    accessToken: string,
    input: { concernTitle: string; durationText: string; symptoms: string },
  ) {
    return request<{ consultation: ApiConsultation }>('/api/v1/consultations', {
      accessToken,
      body: JSON.stringify({ ...input, photoUrls: [] }),
      method: 'POST',
    });
  },

  getDetails(accessToken: string, consultationId: string) {
    return request<{ consultation: ApiConsultation }>(`/api/v1/consultations/${consultationId}`, { accessToken });
  },

  getImageDeliveryUrl(accessToken: string, consultationId: string, attachmentId: string) {
    return request<{
      attachment: ConsultationAttachment;
      delivery: { expiresAt: string; url: string };
    }>(`/api/v1/consultations/${consultationId}/images/${attachmentId}/delivery-url`, { accessToken });
  },

  listMine(accessToken: string) {
    return request<{ consultations: ApiConsultation[] }>('/api/v1/consultations/my?limit=50', { accessToken });
  },

  listOpen(accessToken: string) {
    return request<{ consultations: ApiConsultation[] }>('/api/v1/consultations/open?limit=50', { accessToken });
  },

  accept(accessToken: string, consultationId: string) {
    return request<{ consultation: ApiConsultation }>(`/api/v1/consultations/${consultationId}/accept`, {
      accessToken,
      method: 'PATCH',
    });
  },

  decline(accessToken: string, consultationId: string, reason?: string) {
    return request<{ consultationId: string; declined: true }>(`/api/v1/consultations/${consultationId}/decline`, {
      accessToken,
      body: JSON.stringify(reason ? { reason } : {}),
      method: 'PATCH',
    });
  },

  complete(accessToken: string, consultationId: string, input: { careInstructions?: string; doctorNotes: string; prescriptionUrl?: string }) {
    return request<{ consultation: ApiConsultation }>(`/api/v1/consultations/${consultationId}/complete`, {
      accessToken,
      body: JSON.stringify(input),
      method: 'PATCH',
    });
  },

  async uploadImage(accessToken: string, consultationId: string, photo: ConsultationPhotoUpload) {
    const formData = await createImageFormData(photo);

    return request<{ attachment: ConsultationAttachment }>(`/api/v1/consultations/${consultationId}/images`, {
      accessToken,
      body: formData,
      method: 'POST',
    });
  },
};

export const messageApi = {
  list(accessToken: string, consultationId: string) {
    return request<{ messages: ApiConsultationMessage[]; nextCursor: string | null }>(
      `/api/v1/consultations/${consultationId}/messages?limit=50`,
      { accessToken },
    );
  },

  send(accessToken: string, consultationId: string, body: string) {
    return request<{ message: ApiConsultationMessage }>(`/api/v1/consultations/${consultationId}/messages`, {
      accessToken,
      body: JSON.stringify({ body }),
      method: 'POST',
    });
  },
};

export function getApiErrorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
}
