import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly submitted = signal(false);
  readonly fields = [
    {
      name: 'businessName',
      label: 'Nombre del negocio',
      type: 'text',
      autocomplete: 'organization',
      placeholder: 'Café Nube',
      wide: true,
    },
    {
      name: 'ownerName',
      label: 'Tu nombre',
      type: 'text',
      autocomplete: 'name',
      placeholder: 'Nombre y apellido',
      wide: true,
    },
    {
      name: 'email',
      label: 'Correo electrónico',
      type: 'email',
      autocomplete: 'email',
      placeholder: 'tu@negocio.com',
      wide: true,
    },
  ] as const;
  readonly form = this.fb.nonNullable.group({
    businessName: ['', Validators.required],
    branchName: [''],
    ownerName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    terms: [false, Validators.requiredTrue],
  });
  message(field: string): string {
    const control = this.form.get(field);
    if (!control?.invalid || (!control.touched && !this.submitted())) return '';
    if (control.hasError('required') || control.hasError('requiredTrue'))
      return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'Ingresa un correo electrónico válido.';
    if (control.hasError('minlength')) return 'La contraseña debe tener al menos 8 caracteres.';
    if (field === 'confirmPassword' && control.value !== this.form.controls.password.value)
      return 'Las contraseñas no coinciden.';
    return '';
  }
  submit() {
    this.submitted.set(true);
    this.error.set('');
    if (this.form.controls.confirmPassword.value !== this.form.controls.password.value)
      this.form.controls.confirmPassword.setErrors({ mismatch: true });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { businessName, branchName, ownerName, email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.auth
      .register({ businessName, ...(branchName ? { branchName } : {}), ownerName, email, password })
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl('/login');
        },
        error: (e: { error?: { message?: string } }) => {
          this.loading.set(false);
          this.error.set(
            e.error?.message ?? 'No fue posible registrar el negocio. Inténtalo de nuevo.',
          );
        },
      });
  }
}
