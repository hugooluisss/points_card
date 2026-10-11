import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AppSidebar } from './app-sidebar';
import { Role } from '@points-card/shared';
import { routes } from '../../app.routes';
import { AuthService } from '../../auth/auth.service';
import { of } from 'rxjs';

describe('AppSidebar', () => {
  it('renders grouped navigation and count badges', async () => {
    await TestBed.configureTestingModule({ imports: [AppSidebar], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(AppSidebar);
    fixture.componentRef.setInput('groups', [{ label: 'Operación', items: [{ label: 'Clientes', icon: '♧', count: 24 }] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Operación');
    expect(fixture.nativeElement.textContent).toContain('24');
  });

  it('navigates each sidebar item and highlights the current route', async () => {
    const auth = { user: () => ({ name: 'Ana', businessId: 'Cafe', role: Role.Owner }), restoreSession: () => of({ name: 'Ana', businessId: 'Cafe', role: Role.Owner }), logout: () => of() };
    await TestBed.configureTestingModule({ imports: [AppSidebar], providers: [provideRouter(routes), { provide: AuthService, useValue: auth }] }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/');
    const fixture = harness.fixture;
    for (const [path, title] of [['clientes', 'Clientes'], ['movimientos', 'Movimientos'], ['canjes', 'Canjes'], ['escaner', 'Escáner'], ['programas', 'Programas'], ['configuracion', 'Configuración']]) {
      const link = fixture.nativeElement.querySelector(`a[href="/${path}"]`) as HTMLAnchorElement;
      link.click();
      await harness.fixture.whenStable();
      expect(TestBed.inject(Router).url).toBe(`/${path}`);
      expect(fixture.nativeElement.textContent).toContain(title);
    }
    await harness.navigateByUrl('/');
    const homeLink = [...fixture.nativeElement.querySelectorAll('a[href="/"]')].find((link: HTMLAnchorElement) => link.textContent.includes('Inicio')) as HTMLAnchorElement;
    expect(homeLink.classList).toContain('bg-primary-50');
    await harness.navigateByUrl('/clientes');
    expect(homeLink.classList).not.toContain('bg-primary-50');
    expect(fixture.nativeElement.querySelector('a[href="/clientes"]').classList).toContain('bg-primary-50');
  });

  it('redirects a cashier from programs and settings', async () => {
    const auth = { user: () => ({ name: 'Ana', businessId: 'Cafe', role: Role.Cashier }), restoreSession: () => of({ name: 'Ana', businessId: 'Cafe', role: Role.Cashier }), logout: () => of() };
    await TestBed.configureTestingModule({ imports: [AppSidebar], providers: [provideRouter(routes), { provide: AuthService, useValue: auth }] }).compileComponents();
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/programas');
    expect(TestBed.inject(Router).url).toBe('/');
    await harness.navigateByUrl('/configuracion');
    expect(TestBed.inject(Router).url).toBe('/');
  });
});

