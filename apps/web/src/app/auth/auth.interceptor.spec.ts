import { HttpClient, HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { Role } from '@points-card/shared';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('retries parallel 401 requests once each after one refresh', () => {
    let finishRefresh!: () => void;
    const http = {
      post: vi.fn(
        () =>
          new Observable((subscriber) => {
            finishRefresh = () => {
              subscriber.next({
                accessToken: 'new',
                user: {
                  id: '1',
                  name: 'Ana',
                  role: 'owner',
                  businessId: 'business',
                  branchIds: null,
                },
              });
              subscriber.complete();
            };
          }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    });
    const auth = TestBed.inject(AuthService);
    auth.accessToken.set('old');
    const calls = [0, 0, 0];
    const request = (id: number) => new HttpRequest('GET', `/points-card-api/resource/${id}`);
    const handler = (req: HttpRequest<unknown>) => {
      const id = Number(req.url.split('/').pop());
      calls[id]++;
      expect(req.headers.get('Authorization')).toBe(`Bearer ${calls[id] === 1 ? 'old' : 'new'}`);
      return calls[id] === 1
        ? throwError(() => new HttpErrorResponse({ status: 401 }))
        : of(new HttpResponse());
    };

    TestBed.runInInjectionContext(() => {
      [0, 1, 2].forEach((id) => authInterceptor(request(id), handler).subscribe());
    });

    expect(http.post).toHaveBeenCalledTimes(1);
    finishRefresh();
    expect(calls).toEqual([2, 2, 2]);
  });

  it('clears the session and redirects when refresh fails', () => {
    const navigateByUrl = vi.fn();
    const http = {
      post: vi.fn(() => throwError(() => new Error('refresh failed'))),
    };
    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: http },
        { provide: Router, useValue: { navigateByUrl } },
      ],
    });
    const auth = TestBed.inject(AuthService);
    auth.accessToken.set('expired');
    auth.user.set({
      id: '1',
      name: 'Ana',
      role: Role.Owner,
      businessId: 'business',
      branchIds: null,
    });
    const request = new HttpRequest('GET', '/points-card-api/auth/me');
    TestBed.runInInjectionContext(() => {
      authInterceptor(request, () =>
        throwError(() => new HttpErrorResponse({ status: 401 })),
      ).subscribe({ error: () => undefined });
    });

    expect(auth.accessToken()).toBeNull();
    expect(auth.user()).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
