import { Role } from "../roles";

export interface AuthUser {
  id: string;
  name: string;
  role: Role;
  businessId: string;
  branchIds: string[] | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

/** @deprecated Use AuthResponse. */
export type LoginResponse = AuthResponse;
