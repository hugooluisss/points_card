import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  it('uses the billing API contract', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({ url: 'https://stripe.test' })),
    };
    const injector = createEnvironmentInjector([{ provide: HttpClient, useValue: http }], null!);
    const service = runInInjectionContext(injector, () => new BillingService());
    service.overview().subscribe();
    service.checkout('pro').subscribe();
    service.portal().subscribe();
    expect(http.get).toHaveBeenCalledWith('/points-card-api/billing');
    expect(http.post).toHaveBeenNthCalledWith(1, '/points-card-api/billing/checkout', {
      planId: 'pro',
    });
    expect(http.post).toHaveBeenNthCalledWith(2, '/points-card-api/billing/portal', {});
    injector.destroy();
  });
});
