export type RegistrationFieldKey = "name" | "email" | "phone" | "birthday";

export interface RegistrationFieldConfig {
  key: RegistrationFieldKey;
  required: boolean;
}

export interface RegistrationPageDto {
  businessName: string;
  brandColor: string | null;
  logoUrl: string | null;
  fields: RegistrationFieldConfig[];
  privacyNotice: { version: number; text: string };
}

export interface RegisterCustomerRequest {
  name?: string;
  email?: string;
  phone?: string;
  birthday?: string;
  acceptPrivacy: true;
  acceptMarketing: boolean;
  website: string;
  startedAt: number;
}

export interface RegistrationPass {
  platform: "google" | "apple";
  saveUrl: string;
}

export interface RegisterCustomerResponse {
  existing: boolean;
  message: string;
  passes: RegistrationPass[];
}

export interface CardRecoveryDto {
  businessName: string;
  cardCode: string;
  passes: RegistrationPass[];
}

export interface RegistrationSettingsDto {
  fields: RegistrationFieldConfig[];
  brandColor: string | null;
  logoUrl: string | null;
  publicCode: string;
  publicUrl: string;
}

export interface PrivacyNoticeDto {
  version: number;
  text: string;
  createdAt: string;
}
