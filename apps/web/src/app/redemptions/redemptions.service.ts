import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BranchOptionDto, Page, RedemptionItemDto } from '@points-card/shared';
import { API_BASE } from '../core/api-base';

export interface RedemptionFilters {
  from: string;
  to: string;
  branchId: string;
  page: number;
  pageSize: number;
}

@Injectable({ providedIn: 'root' })
export class RedemptionsService {
  private readonly http = inject(HttpClient);
  list(filters: RedemptionFilters) {
    let params = new HttpParams().set('page', filters.page).set('pageSize', filters.pageSize);
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    if (filters.branchId) params = params.set('branchId', filters.branchId);
    return this.http.get<Page<RedemptionItemDto>>(`${API_BASE}/redemptions`, { params });
  }
  branches() {
    return this.http.get<BranchOptionDto[]>(`${API_BASE}/branches`);
  }
}
