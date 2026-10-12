import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { RedemptionsService } from './redemptions.service';

describe('RedemptionsService', () => {
  let api: RedemptionsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(RedemptionsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('builds redemption filters and pagination', () => {
    api
      .list({ from: '2026-01-01', to: '2026-01-31', branchId: 'b', page: 2, pageSize: 10 })
      .subscribe();
    const request = http.expectOne((r) => r.url === `${API_BASE}/redemptions`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('branchId')).toBe('b');
    request.flush({ items: [], total: 0, page: 2, pageSize: 10 });
  });
});
