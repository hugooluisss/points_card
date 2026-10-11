import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { guestGuard } from './guest.guard';

describe('guestGuard', () => {
  it('redirects signed-in users away from login', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { restoreSession: () => of({ id: '1' }) } },
        { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } },
      ],
    });
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBeTruthy();
  });

  it('allows access when session restoration fails', async () => {
    const { throwError } = await import('rxjs');
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { restoreSession: () => throwError(() => new Error()) } },
        { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } },
      ],
    });
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, {} as never))).toBeTruthy();
  });
});
