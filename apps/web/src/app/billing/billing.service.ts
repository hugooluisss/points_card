import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BillingCheckoutResponse, BillingOverviewDto } from '@points-card/shared';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/api-base';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);

  overview(): Observable<BillingOverviewDto> {
    return this.http.get<BillingOverviewDto>(`${API_BASE}/billing`);
  }

  checkout(planId: string): Observable<BillingCheckoutResponse> {
    return this.http.post<BillingCheckoutResponse>(`${API_BASE}/billing/checkout`, { planId });
  }

  portal(): Observable<BillingCheckoutResponse> {
    return this.http.post<BillingCheckoutResponse>(`${API_BASE}/billing/portal`, {});
  }
}
