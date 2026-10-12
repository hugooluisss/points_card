import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Role } from '@points-card/shared';
import { of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { roleGuard } from '../auth/role.guard';
import { SETTINGS_ROUTES } from './settings.routes';

@Component({ standalone: true, template: '' })
class TestPage {}

describe('settings route access', () => {
  it('denies a cashier access to registration and billing', async () => {
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', pathMatch: 'full', component: TestPage },
          {
            path: 'configuracion',
            children: SETTINGS_ROUTES,
          },
        ]),
        { provide: AuthService, useValue: { restoreSession: () => of({ role: Role.Cashier }) } },
      ],
    }).compileComponents();
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/configuracion/registro');
    expect(TestBed.inject(Router).url).toBe('/');

    await harness.navigateByUrl('/configuracion/facturacion');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});
