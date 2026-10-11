import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const apiRequest = request.url.startsWith('/points-card-api/');

  const send = (retried = false): Observable<HttpEvent<unknown>> => {
    const token = auth.accessToken();
    const outgoing =
      apiRequest && token
        ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : request;

    return next(outgoing).pipe(
      catchError((error: unknown) => {
        const shouldRefresh =
          !retried &&
          apiRequest &&
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !request.url.includes('/auth/refresh') &&
          !request.url.includes('/auth/login');

        if (!shouldRefresh) return throwError(() => error);

        return auth.refresh().pipe(
          switchMap(() => send(true)),
          catchError((refreshError: unknown) => {
            auth.handleRefreshFailure();
            return throwError(() => refreshError);
          }),
        );
      }),
    );
  };

  return send();
};
