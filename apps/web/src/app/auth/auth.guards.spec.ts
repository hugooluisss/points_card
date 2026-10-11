import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { authGuard, guestGuard, roleGuard, rolesForMenuItem } from './auth.guards';
import { Role } from '@points-card/shared';
import { firstValueFrom } from 'rxjs';

describe('auth guards', () => {
  it('redirects a signed-out user to login', () => {
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { restoreSession: () => of(null) } }, { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } }] });
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBeTruthy();
  });
  it('redirects signed-in users away from login', () => {
    TestBed.configureTestingModule({ providers: [{ provide: AuthService, useValue: { restoreSession: () => of({ id: '1' }) } }, { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } }] });
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBeTruthy();
  });

      it('allows roles derived from the menu and redirects other signed-in roles home', async () => {
    for (const [role, expected] of [[Role.Owner, true], [Role.Manager, true], [Role.Cashier, false]] as const) {
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: { restoreSession: () => of({ role }) } },
          { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } },
        ],
      });
      const result = await firstValueFrom(TestBed.runInInjectionContext(() => roleGuard({ data: { roles: rolesForMenuItem('Programas') } } as never, {} as never)) as ReturnType<typeof of>);
      expect(result).toBe(expected ? true : '/');
      TestBed.resetTestingModule();
    }
  });
});
