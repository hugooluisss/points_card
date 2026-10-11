import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE } from '../core/api-base';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let http: HttpTestingController;
  let service: SyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(SyncService);
  });

  afterEach(() => http.verify());

  it('loads failed sync jobs from the API base', () => {
    service.failed().subscribe((jobs) => expect(jobs).toEqual([]));
    http.expectOne(`${API_BASE}/wallet-sync/failed`).flush([]);
  });

  it('posts retry requests for a job', () => {
    service.retry('job-1').subscribe((job) => expect(job.id).toBe('job-1'));
    http
      .expectOne({ method: 'POST', url: `${API_BASE}/wallet-sync/job-1/retry` })
      .flush({ id: 'job-1' });
  });
});
