import { HttpClient } from '@angular/common/http';
import { createEnvironmentInjector, runInInjectionContext } from '@angular/core';
import { of } from 'rxjs';
import { ScannerService } from './scanner.service';

describe('ScannerService', () => {
  it('uses the API prefix for card lookup and ledger actions', () => {
    const http = {
      get: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({ transaction: {} })),
    };
    const injector = createEnvironmentInjector([{ provide: HttpClient, useValue: http }], null!);
    const service = runInInjectionContext(injector, () => new ScannerService());
    service.card('PC-1').subscribe();
    service.accumulate({ cardCode: 'PC-1', branchId: 'b', idempotencyKey: 'k' }).subscribe();
    service
      .redeem({ cardCode: 'PC-1', branchId: 'b', rewardId: 'r', idempotencyKey: 'k' })
      .subscribe();
    expect(http.get).toHaveBeenCalledWith('/points-card-api/cards/PC-1');
    expect(http.post).toHaveBeenNthCalledWith(1, '/points-card-api/ledger/accumulate', {
      cardCode: 'PC-1',
      branchId: 'b',
      idempotencyKey: 'k',
    });
    expect(http.post).toHaveBeenNthCalledWith(2, '/points-card-api/ledger/redeem', {
      cardCode: 'PC-1',
      branchId: 'b',
      rewardId: 'r',
      idempotencyKey: 'k',
    });
    injector.destroy();
  });
});
