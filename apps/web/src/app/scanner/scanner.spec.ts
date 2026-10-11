import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CameraScanner } from './camera-scanner';
import { Scanner } from './scanner';
import { ScannerService } from './scanner.service';

describe('Scanner', () => {
  let service: {
    card: ReturnType<typeof vi.fn>;
    accumulate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
    const http = { get: vi.fn(), post: vi.fn() };
    const camera = { scan: vi.fn() };
    service = {
      card: vi.fn().mockReturnValue({
        subscribe: (observer: any) =>
          observer.next({
            accountId: 'a',
            cardCode: 'PC-1',
            balance: 2,
            progress: 2,
            goal: 10,
            rewardAvailable: false,
            rewards: [],
          }),
      }),
      accumulate: vi.fn().mockReturnValue({
        subscribe: (observer: any) => observer.error(new HttpErrorResponse({ status: 0 })),
      }),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: HttpClient, useValue: http },
        { provide: ScannerService, useValue: service },
        { provide: CameraScanner, useValue: camera },
        { provide: AuthService, useValue: { user: () => ({ branchIds: ['branch'] }) } },
      ],
    });
  });

  it('requires confirmation and reuses the idempotency key on connection retry', () => {
    const fixture = TestBed.createComponent(Scanner);
    const component = fixture.componentInstance;
    component.code = 'PC-1';
    component.lookup();
    component.choose({ type: 'stamp' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Confirmar y registrar');
    expect(service.accumulate).not.toHaveBeenCalled();
    component.confirm();
    const key = service.accumulate.mock.calls[0][0].idempotencyKey;
    component.confirm(true);
    expect(service.accumulate).toHaveBeenCalledTimes(2);
    expect(service.accumulate.mock.calls[1][0].idempotencyKey).toBe(key);
    expect(service.accumulate.mock.calls[1][0].branchId).toBe('branch');
    fixture.destroy();
  });
});
