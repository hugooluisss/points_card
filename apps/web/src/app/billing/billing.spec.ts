import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { BillingOverviewDto } from '@points-card/shared';
import { of } from 'rxjs';
import { Billing } from './billing';
import { BillingNavigator } from './billing-navigator';
import { BillingService } from './billing.service';

const plan = {
  id: 'starter',
  name: 'Inicial',
  priceMonthly: 299,
  currency: 'MXN' as const,
  maxBranches: 2,
  maxStaff: 5,
  maxCards: 1000,
};
const overview = (status: BillingOverviewDto['status']): BillingOverviewDto => ({
  status,
  plan,
  trialEndsAt: '2026-10-15T00:00:00.000Z',
  currentPeriodEnd: null,
  graceEndsAt: '2026-10-20T00:00:00.000Z',
  usage: { branches: 2, staff: 3, cards: 100 },
  plans: [plan],
});

describe('Billing', () => {
  let service: {
    overview: ReturnType<typeof vi.fn>;
    checkout: ReturnType<typeof vi.fn>;
    portal: ReturnType<typeof vi.fn>;
  };
  let navigator: { go: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    TestBed.resetTestingModule();
    service = {
      overview: vi.fn().mockReturnValue(of(overview('active'))),
      checkout: vi.fn().mockReturnValue(of({ url: 'https://stripe.test/checkout' })),
      portal: vi.fn().mockReturnValue(of({ url: 'https://stripe.test/portal' })),
    };
    navigator = { go: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: { get: vi.fn(), post: vi.fn() } },
        { provide: BillingService, useValue: service },
        { provide: BillingNavigator, useValue: navigator },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    });
  });

  it.each([
    ['trial', 'Prueba con'],
    ['active', 'Activa'],
    ['past_due', 'Hay un problema con tu pago'],
    ['canceled', 'Tu suscripción está cancelada'],
  ] as const)('shows %s status details', (status, text) => {
    service.overview.mockReturnValue(of(overview(status)));
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(text);
    expect(fixture.nativeElement.textContent).toContain('Límite alcanzado');
    fixture.destroy();
  });

  it('checks out through the navigator and shows a return banner', () => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: { snapshot: { queryParamMap: { get: () => 'success' } } },
    });
    const fixture = TestBed.createComponent(Billing);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Estamos confirmando tu suscripción');
    fixture.componentInstance.choose(plan);
    expect(service.checkout).toHaveBeenCalledWith('starter');
    expect(navigator.go).toHaveBeenCalledWith('https://stripe.test/checkout');
    fixture.destroy();
  });
});
