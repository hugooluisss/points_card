import { inject } from '@angular/core';
import { Role } from '@points-card/shared';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const roles = route.data['roles'] as Role[];

  return auth.restoreSession().pipe(
    map((user) => (user && roles.includes(user.role) ? true : router.createUrlTree(['/']))),
    catchError(() => of(router.createUrlTree(['/login']))),
  );
};
