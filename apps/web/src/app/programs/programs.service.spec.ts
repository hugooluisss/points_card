import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProgramsService } from './programs.service';

describe('ProgramsService', () => {
  let service: ProgramsService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProgramsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('uses API_BASE for programs and reward actions', () => {
    service.list().subscribe();
    http.expectOne('/points-card-api/programs').flush([]);
    service.pauseReward('p1', 'r1').subscribe();
    http.expectOne({ method: 'DELETE', url: '/points-card-api/programs/p1/rewards/r1' }).flush({});
  });
});
