import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Role } from '@points-card/shared';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from './auth.service';
import { rolesForMenuItem } from '../dashboard/menu';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  it('allows roles derived from the menu and redirects other signed-in roles home', async () => {
    for (const [role, expected] of [
      [Role.Owner, true],
      [Role.Manager, true],
      [Role.Cashier, false],
    ] as const) {
      TestBed.configureTestingModule({
        providers: [
          { provide: AuthService, useValue: { restoreSession: () => of({ role }) } },
          { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } },
        ],
      });
      const result = await firstValueFrom(
        TestBed.runInInjectionContext(() =>
          roleGuard({ data: { roles: rolesForMenuItem('Programas') } } as never, {} as never),
        ) as ReturnType<typeof of>,
      );
      expect(result).toBe(expected ? true : '/');
      TestBed.resetTestingModule();
    }
  });
});
