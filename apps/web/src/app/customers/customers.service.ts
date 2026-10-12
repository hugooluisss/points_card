import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BranchOptionDto, CustomerDetailDto, CustomerListItemDto, Page } from '@points-card/shared';
import { API_BASE } from '../core/api-base';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly http = inject(HttpClient);
  list(search: string, page: number, pageSize: number) {
    return this.http.get<Page<CustomerListItemDto>>(`${API_BASE}/customers`, {
      params: new HttpParams().set('search', search).set('page', page).set('pageSize', pageSize),
    });
  }
  detail(id: string) {
    return this.http.get<CustomerDetailDto>(`${API_BASE}/customers/${id}/detail`);
  }
  branches() {
    return this.http.get<BranchOptionDto[]>(`${API_BASE}/branches`);
  }
  export() {
    return this.http.get(`${API_BASE}/exports/customers.csv`, { responseType: 'blob' });
  }
}
