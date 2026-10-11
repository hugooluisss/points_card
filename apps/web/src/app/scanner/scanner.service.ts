import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  AccumulateRequest,
  CardLookupResponse,
  LedgerTransactionDto,
  RedeemRequest,
} from '@points-card/shared';
import { Observable } from 'rxjs';
import { API_BASE } from '../core/api-base';

@Injectable({ providedIn: 'root' })
export class ScannerService {
  private readonly http = inject(HttpClient);

  card(code: string): Observable<CardLookupResponse> {
    return this.http.get<CardLookupResponse>(`${API_BASE}/cards/${encodeURIComponent(code)}`);
  }

  accumulate(
    request: Omit<AccumulateRequest, 'idempotencyKey'> & { idempotencyKey: string },
  ): Observable<{ transaction: LedgerTransactionDto }> {
    return this.http.post<{ transaction: LedgerTransactionDto }>(
      `${API_BASE}/ledger/accumulate`,
      request,
    );
  }

  redeem(
    request: Omit<RedeemRequest, 'idempotencyKey'> & { idempotencyKey: string },
  ): Observable<{ transaction: LedgerTransactionDto }> {
    return this.http.post<{ transaction: LedgerTransactionDto }>(
      `${API_BASE}/ledger/redeem`,
      request,
    );
  }
}
