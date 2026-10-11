import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Login } from './login';

describe('Login form', () => {
  it('shows Spanish required errors without sending a request', async () => {
    const auth = { login: vi.fn() };
    await TestBed.configureTestingModule({ imports: [Login], providers: [provideRouter([]), { provide: AuthService, useValue: auth }] }).compileComponents();
    const fixture = TestBed.createComponent(Login); fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El correo electrónico es obligatorio.');
    expect(fixture.nativeElement.textContent).toContain('La contraseña es obligatoria.');
    expect(auth.login).not.toHaveBeenCalled();
  });
});
