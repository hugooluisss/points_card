import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  BranchOptionDto,
  DashboardPeriod,
  DashboardSummaryDto,
  MetricsDto,
} from '@points-card/shared';
import { API_BASE } from '../core/api-base';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  summary(period: DashboardPeriod, branchId?: string) {
    let params = new HttpParams().set('period', period);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<DashboardSummaryDto>(`${API_BASE}/dashboard/summary`, { params });
  }
  metrics(period: DashboardPeriod, branchId?: string) {
    let params = new HttpParams().set('period', period);
    if (branchId) params = params.set('branchId', branchId);
    return this.http.get<MetricsDto>(`${API_BASE}/metrics`, { params });
  }
  branches() {
    return this.http.get<BranchOptionDto[]>(`${API_BASE}/branches`);
  }
}
