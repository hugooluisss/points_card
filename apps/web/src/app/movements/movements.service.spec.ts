import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { MovementsService } from './movements.service';

describe('MovementsService', () => {
  let api: MovementsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(MovementsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('builds movement filters and pagination', () => {
    api
      .list({
        from: '2026-01-01',
        to: '2026-01-31',
        branchId: 'b',
        staffId: 's',
        type: 'redeem',
        page: 3,
        pageSize: 20,
      })
      .subscribe();
    const request = http.expectOne((r) => r.url === `${API_BASE}/movements`);
    expect(request.request.params.get('branchId')).toBe('b');
    expect(request.request.params.get('page')).toBe('3');
    expect(request.request.params.get('type')).toBe('redeem');
    request.flush({ items: [], total: 0, page: 3, pageSize: 20 });
  });
});
