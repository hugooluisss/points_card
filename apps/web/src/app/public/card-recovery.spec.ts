import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { CardRecovery } from './card-recovery';

describe('CardRecovery', () => {
  it('shows an expired or used link message', () => {
    TestBed.configureTestingModule({
      imports: [CardRecovery],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ token: 'expired' }) } },
        },
      ],
    });
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(CardRecovery);
    fixture.detectChanges();
    http
      .expectOne((request) => request.url.endsWith('/public/card/expired'))
      .flush({}, { status: 410, statusText: 'Gone' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ya se utilizó o venció');
    http.verify();
  });
});
