import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  let api: DashboardService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('sends period and optional branch filters', () => {
    api.summary('30d', 'branch-1').subscribe();
    const request = http.expectOne((r) => r.url === `${API_BASE}/dashboard/summary`);
    expect(request.request.params.get('period')).toBe('30d');
    expect(request.request.params.get('branchId')).toBe('branch-1');
    request.flush({});
  });
});
