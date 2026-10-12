import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { RegistrationService } from './registration.service';

describe('RegistrationService', () => {
  let http: HttpTestingController;
  let service: RegistrationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(RegistrationService);
  });
  afterEach(() => http.verify());

  it('loads registration and recovers a card through public endpoints', () => {
    service.page('cafe-1').subscribe();
    http.expectOne(`${API_BASE}/public/registration/cafe-1`).flush({});
    service.recover('one-use').subscribe();
    http.expectOne(`${API_BASE}/public/card/one-use`).flush({});
  });

  it('sends registration and loads QR SVG text', () => {
    const body = {
      name: 'Ana',
      acceptPrivacy: true as const,
      acceptMarketing: false,
      website: '',
      startedAt: 1,
    };
    service.register('cafe-1', body).subscribe();
    http.expectOne({ method: 'POST', url: `${API_BASE}/public/registration/cafe-1` }).flush({});
    service.registrationQr().subscribe();
    http.expectOne({ method: 'GET', url: `${API_BASE}/registration-qr` }).flush('<svg/>');
  });

  it('loads and updates settings and privacy notices', () => {
    service.settings().subscribe();
    http.expectOne(`${API_BASE}/registration-settings`).flush({});
    service.saveSettings({ fields: [], brandColor: null, logoUrl: null }).subscribe();
    http.expectOne({ method: 'PUT', url: `${API_BASE}/registration-settings` }).flush({});
    service.privacyNotice().subscribe();
    http.expectOne(`${API_BASE}/privacy-notices/current`).flush({});
    service.publishPrivacyNotice('Aviso').subscribe();
    http.expectOne({ method: 'POST', url: `${API_BASE}/privacy-notices` }).flush({});
  });
});
