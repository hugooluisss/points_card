import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role } from '@points-card/shared';
import { AuthService } from '../auth/auth.service';
import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders role-based navigation and user identity', async () => {
    await TestBed.configureTestingModule({
      imports: [AppShell],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            user: () => ({ name: 'Ana Ruiz', businessId: 'Café Nube', role: Role.Cashier }),
            logout: () => ({ subscribe: vi.fn() }),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppShell);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ana Ruiz');
    expect(fixture.nativeElement.textContent).not.toContain('Configuración');
  });
});
