import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  message(field: 'email' | 'password'): string {
    const control = this.form.controls[field];
    if (!control.invalid || (!control.touched && !this.submitted())) return '';
    return control.hasError('required')
      ? field === 'email'
        ? 'El correo electrónico es obligatorio.'
        : 'La contraseña es obligatoria.'
      : 'Ingresa un correo electrónico válido.';
  }
  submit() {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigateByUrl('/');
      },
      error: (e: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(e.error?.message ?? 'No fue posible iniciar sesión. Inténtalo de nuevo.');
      },
    });
  }
}
