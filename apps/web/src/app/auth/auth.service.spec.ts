import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

const response = {
  accessToken: 'token',
  user: { id: '1', name: 'Ana', role: 'owner', businessId: 'b', branchIds: null },
};

describe('AuthService', () => {
  it('stores the login token only in memory and includes credentials', () => {
    const http = { post: vi.fn().mockReturnValue(of(response)) };
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: http }, provideRouter([])],
    });
    const service = TestBed.inject(AuthService);

    service.login({ email: 'a@b.com', password: 'password' }).subscribe();

    expect(http.post).toHaveBeenCalledWith(
      '/points-card-api/auth/login',
      { email: 'a@b.com', password: 'password' },
      { withCredentials: true },
    );
    expect(service.accessToken()).toBe('token');
    expect(localStorage.length).toBe(0);
  });

  it('shares one refresh request between parallel callers', () => {
    let complete!: (value: typeof response) => void;
    const http = {
      post: vi.fn(
        () =>
          new Observable<typeof response>((subscriber) => {
            complete = (value) => {
              subscriber.next(value);
              subscriber.complete();
            };
          }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: http }, provideRouter([])],
    });
    const service = TestBed.inject(AuthService);
    const values: string[] = [];

    service.refresh().subscribe(({ accessToken }) => values.push(accessToken));
    service.refresh().subscribe(({ accessToken }) => values.push(accessToken));

    expect(http.post).toHaveBeenCalledTimes(1);
    complete(response);
    expect(values).toEqual(['token', 'token']);
  });

  it('shares concurrent session restoration', () => {
    let complete!: (value: typeof response) => void;
    const http = {
      post: vi.fn(
        () =>
          new Observable<typeof response>((subscriber) => {
            complete = (value) => {
              subscriber.next(value);
              subscriber.complete();
            };
          }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: http }, provideRouter([])],
    });
    const service = TestBed.inject(AuthService);

    service.restoreSession().subscribe();
    service.restoreSession().subscribe();

    expect(http.post).toHaveBeenCalledTimes(1);
    complete(response);
    expect(service.user()?.id).toBe('1');
  });
});
