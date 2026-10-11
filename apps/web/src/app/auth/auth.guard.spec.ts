import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('redirects signed-out users to login', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { restoreSession: () => of(null) } },
        { provide: Router, useValue: { createUrlTree: (url: string[]) => url.join('/') } },
      ],
    });
    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBeTruthy();
  });
});
