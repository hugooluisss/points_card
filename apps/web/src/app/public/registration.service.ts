import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  CardRecoveryDto,
  PrivacyNoticeDto,
  RegisterCustomerRequest,
  RegisterCustomerResponse,
  RegistrationPageDto,
  RegistrationSettingsDto,
} from '@points-card/shared';
import { API_BASE } from '../core/api-base';

@Injectable({ providedIn: 'root' })
export class RegistrationService {
  private readonly http = inject(HttpClient);

  page(code: string) {
    return this.http.get<RegistrationPageDto>(
      `${API_BASE}/public/registration/${encodeURIComponent(code)}`,
    );
  }

  register(code: string, body: RegisterCustomerRequest) {
    return this.http.post<RegisterCustomerResponse>(
      `${API_BASE}/public/registration/${encodeURIComponent(code)}`,
      body,
    );
  }

  recover(token: string) {
    return this.http.get<CardRecoveryDto>(`${API_BASE}/public/card/${encodeURIComponent(token)}`);
  }

  settings() {
    return this.http.get<RegistrationSettingsDto>(`${API_BASE}/registration-settings`);
  }

  saveSettings(body: Pick<RegistrationSettingsDto, 'fields' | 'brandColor' | 'logoUrl'>) {
    return this.http.put<RegistrationSettingsDto>(`${API_BASE}/registration-settings`, body);
  }

  privacyNotice() {
    return this.http.get<PrivacyNoticeDto>(`${API_BASE}/privacy-notices/current`);
  }

  publishPrivacyNotice(text: string) {
    return this.http.post<PrivacyNoticeDto>(`${API_BASE}/privacy-notices`, { text });
  }

  registrationQr() {
    return this.http.get(`${API_BASE}/registration-qr`, { responseType: 'text' });
  }
}
