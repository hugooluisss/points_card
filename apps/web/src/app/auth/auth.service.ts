import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  MeResponse,
  RegisterBusinessDto,
} from '@points-card/shared';
import { catchError, finalize, map, Observable, of, shareReplay, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private refreshRequest?: Observable<AuthResponse>;
  private restoreRequest?: Observable<AuthUser | null>;

  readonly accessToken = signal<string | null>(null);
  readonly user = signal<AuthUser | null>(null);

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/points-card-api/auth/login', request, {
        withCredentials: true,
      })
      .pipe(tap(({ accessToken, user }) => this.setSession(accessToken, user)));
  }

  register(request: RegisterBusinessDto): Observable<void> {
    return this.http.post<void>('/points-card-api/businesses/register', request, {
      withCredentials: true,
    });
  }

  refresh(): Observable<AuthResponse> {
    if (!this.refreshRequest) {
      const request = this.http
        .post<AuthResponse>(
          '/points-card-api/auth/refresh',
          {},
          {
            withCredentials: true,
          },
        )
        .pipe(
          tap(({ accessToken, user }) => this.setSession(accessToken, user)),
          finalize(() => {
            if (this.refreshRequest === request) this.refreshRequest = undefined;
          }),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      this.refreshRequest = request;
    }
    return this.refreshRequest;
  }

  restoreSession(): Observable<AuthUser | null> {
    if (this.user()) return of(this.user());
    if (!this.restoreRequest) {
      const request = this.refresh().pipe(
        map(({ user }) => user),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
        finalize(() => {
          if (this.restoreRequest === request) this.restoreRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      this.restoreRequest = request;
    }
    return this.restoreRequest;
  }

  me(): Observable<AuthUser> {
    return this.http.get<MeResponse>('/points-card-api/auth/me').pipe(
      map(({ user }) => user),
      tap((user) => this.user.set(user)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>('/points-card-api/auth/logout', {}, { withCredentials: true }).pipe(
      catchError(() => of(void 0)),
      tap(() => {
        this.clearSession();
        void this.router.navigateByUrl('/login');
      }),
    );
  }

  handleRefreshFailure() {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  private setSession(accessToken: string, user: AuthUser) {
    this.accessToken.set(accessToken);
    this.user.set(user);
  }

  private clearSession() {
    this.accessToken.set(null);
    this.user.set(null);
  }
}
