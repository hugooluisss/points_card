import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { Register } from './register';

describe('Register form', () => {
  it('shows required errors without sending a request', async () => {
    const auth = { register: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    }).compileComponents();
    const fixture = TestBed.createComponent(Register);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Este campo es obligatorio.');
    expect(auth.register).not.toHaveBeenCalled();
  });
});
