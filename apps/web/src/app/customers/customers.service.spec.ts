import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE } from '../core/api-base';
import { CustomersService } from './customers.service';

describe('CustomersService', () => {
  let api: CustomersService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(CustomersService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('builds list query parameters', () => {
    api.list('ana', 2, 25).subscribe();
    const request = http.expectOne((r) => r.url === `${API_BASE}/customers`);
    expect(request.request.params.get('search')).toBe('ana');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('25');
    request.flush({ items: [], total: 0, page: 2, pageSize: 25 });
  });
});
