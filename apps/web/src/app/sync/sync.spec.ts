import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { Sync } from './sync';

describe('Sync', () => {
  let http: HttpTestingController;
  let fixture: ReturnType<typeof TestBed.createComponent<Sync>> | undefined;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Sync],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    fixture?.destroy();
    fixture = undefined;
    http.verify();
  });

  function create() {
    fixture = TestBed.createComponent(Sync);
    fixture.detectChanges();
    const request = http.expectOne(`${API_BASE}/wallet-sync/failed`);
    return { fixture, request };
  }

  it('shows the empty state', () => {
    const { fixture, request } = create();
    request.flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay sincronizaciones fallidas.');
  });

  it('shows loaded jobs without exposing the full card code and removes a retried job', () => {
    const { fixture, request } = create();
    request.flush([
      {
        id: 'j1',
        accountId: 'account-123456',
        cardCode: 'full-card-code-1940',
        attempts: 3,
        lastError: 'Falló',
        updatedAt: '2026-10-11T10:00:00Z',
        platform: 'apple',
      },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Apple Wallet');
    expect(fixture.nativeElement.textContent).toContain('Cuenta •••• 123456');
    expect(fixture.nativeElement.textContent).not.toContain('account-123456');
    expect(fixture.nativeElement.textContent).toContain('•••• 1940');
    expect(fixture.nativeElement.textContent).not.toContain('full-card-code-1940');
    [...fixture.nativeElement.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reintentar'))!
      .click();
    const retry = http.expectOne({ method: 'POST', url: `${API_BASE}/wallet-sync/j1/retry` });
    retry.flush({ id: 'j1' });
    http.expectOne(`${API_BASE}/wallet-sync/failed`).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Cuenta •••• 123456');
  });

  it('shows a Spanish error when retry fails', () => {
    const { fixture, request } = create();
    request.flush([
      {
        id: 'j1',
        accountId: 'acct',
        attempts: 3,
        lastError: 'Falló',
        updatedAt: '2026-10-11T10:00:00Z',
      },
    ]);
    fixture.detectChanges();
    [...fixture.nativeElement.querySelectorAll('button')]
      .find((button) => button.textContent?.includes('Reintentar'))!
      .click();
    http
      .expectOne({ method: 'POST', url: `${API_BASE}/wallet-sync/j1/retry` })
      .flush({}, { status: 500, statusText: 'Failed' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No se pudo solicitar el reintento. Inténtalo de nuevo.',
    );
  });
});
