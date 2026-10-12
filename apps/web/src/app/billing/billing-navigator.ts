import { Inject, Injectable, InjectionToken } from '@angular/core';

export const BILLING_LOCATION = new InjectionToken<Pick<Location, 'assign'>>('BILLING_LOCATION', {
  providedIn: 'root',
  factory: () => window.location,
});

@Injectable({ providedIn: 'root' })
export class BillingNavigator {
  constructor(@Inject(BILLING_LOCATION) private readonly location: Pick<Location, 'assign'>) {}

  go(url: string): void {
    this.location.assign(url);
  }
}
