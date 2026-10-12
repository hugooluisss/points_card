import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from '../auth/auth.service';
import { Home } from './home';

describe('Home', () => {
  it('renders the dashboard summary and next step', async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { user: () => ({ branchIds: ['restricted'] }) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http
      .expectOne((request) => request.url.endsWith('/dashboard/summary'))
      .flush({
        period: '30d',
        kpis: {
          registeredCustomers: { value: 0, previous: 0 },
          issuedPasses: { value: 0, previous: 0 },
          operations: { value: 0, previous: 0 },
          redemptions: { value: 0, previous: 0 },
        },
        savedPassesAvailable: false,
        operationsPerDay: [],
        recent: [],
      });
    http
      .expectOne((request) => request.url.endsWith('/metrics'))
      .flush({
        registrations: 0,
        activeCustomers: 0,
        repeatVisitRate: 0,
        redemptionRate: 0,
        issuedPasses: 0,
        savedPasses: null,
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resumen del negocio');
    expect(fixture.nativeElement.textContent).toContain('No disponible');
  });
});
