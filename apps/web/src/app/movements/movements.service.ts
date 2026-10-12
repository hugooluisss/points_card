import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ActivityItemDto, BranchOptionDto, Page, StaffOptionDto } from '@points-card/shared';
import { API_BASE } from '../core/api-base';

export interface MovementFilters {
  from: string;
  to: string;
  branchId: string;
  staffId: string;
  type: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class MovementsService {
  private readonly http = inject(HttpClient);
  list(filters: MovementFilters) {
    let params = new HttpParams();
    for (const key of ['from', 'to', 'branchId', 'staffId', 'type'] as const)
      if (filters[key]) params = params.set(key, filters[key]);
    params = params.set('page', filters.page).set('pageSize', filters.pageSize);
    return this.http.get<Page<ActivityItemDto>>(`${API_BASE}/movements`, { params });
  }
  branches() {
    return this.http.get<BranchOptionDto[]>(`${API_BASE}/branches`);
  }
  staff() {
    return this.http.get<StaffOptionDto[]>(`${API_BASE}/staff/options`);
  }
  export(filters: Pick<MovementFilters, 'from' | 'to' | 'branchId'>) {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    return this.http.get(`${API_BASE}/exports/movements.csv`, { params, responseType: 'blob' });
  }
}
