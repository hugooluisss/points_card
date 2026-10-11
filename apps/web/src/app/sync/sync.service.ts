import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE } from '../core/api-base';

export interface FailedSyncJob {
  id: string;
  accountId: string;
  attempts: number;
  lastError: string | null;
  updatedAt: string;
  platform?: string;
  cardCode?: string;
}

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly http = inject(HttpClient);

  failed() {
    return this.http.get<FailedSyncJob[]>(`${API_BASE}/wallet-sync/failed`);
  }

  retry(id: string) {
    return this.http.post<FailedSyncJob>(
      `${API_BASE}/wallet-sync/${encodeURIComponent(id)}/retry`,
      {},
    );
  }
}
