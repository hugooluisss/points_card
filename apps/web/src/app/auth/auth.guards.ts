import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';
import { Role } from '@points-card/shared';
import { rolesForMenuItem } from '../dashboard/menu';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map((user) => (user ? true : router.createUrlTree(['/login']))),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.restoreSession().pipe(
    map((user) => (user ? router.createUrlTree(['/']) : true)),
    catchError(() => of(true)),
  );
};

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as Role[];

  return auth.restoreSession().pipe(
    map((user) => user && roles.includes(user.role) ? true : router.createUrlTree(['/'])),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};

export { rolesForMenuItem };
