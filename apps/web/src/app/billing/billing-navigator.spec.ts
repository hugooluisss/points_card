import { BillingNavigator } from './billing-navigator';
import { BILLING_LOCATION } from './billing-navigator';
import { TestBed } from '@angular/core/testing';

describe('BillingNavigator', () => {
  it('redirects to the Stripe URL', () => {
    const assign = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: BILLING_LOCATION, useValue: { assign } }],
    });
    TestBed.inject(BillingNavigator).go('https://stripe.test/session');
    expect(assign).toHaveBeenCalledWith('https://stripe.test/session');
  });
});
