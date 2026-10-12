import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  RegistrationFieldKey,
  RegistrationPageDto,
  RegisterCustomerRequest,
  RegistrationPass,
} from '@points-card/shared';
import { DeviceDetectionService } from './device-detection.service';
import { RegistrationService } from './registration.service';
import { walletButtons } from './wallet-buttons';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './customer-registration.html',
  styleUrl: './customer-registration.scss',
})
export class CustomerRegistration implements OnInit {
  private readonly api = inject(RegistrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly device = inject(DeviceDetectionService);
  readonly code = this.route.snapshot.paramMap.get('publicCode') ?? '';
  readonly startedAt = Date.now();
  readonly page = signal<RegistrationPageDto | null>(null);
  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly existing = signal(false);
  readonly passes = signal<RegistrationPass[]>([]);
  readonly buttonOrder = this.device.detect();
  readonly values: Record<RegistrationFieldKey, string> = {
    name: '',
    email: '',
    phone: '',
    birthday: '',
  };
  acceptPrivacy = false;
  acceptMarketing = false;
  website = '';
  submitted = false;

  ngOnInit() {
    this.api.page(this.code).subscribe({
      next: (page) => {
        this.page.set(page);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el registro. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }

  fieldError(key: RegistrationFieldKey, required: boolean) {
    if (!this.submitted) return '';
    const value = this.values[key].trim();
    if (required && !value) return 'Este campo es obligatorio.';
    if (!value) return '';
    if (key === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Escribe un correo electrónico válido.';
    if (key === 'phone' && !/^\d{10,15}$/.test(value.replace(/[\s()+-]/g, '')))
      return 'Escribe un teléfono válido con 10 a 15 dígitos.';
    if (key === 'birthday' && value > new Date().toLocaleDateString('en-CA'))
      return 'La fecha de nacimiento no puede ser futura.';
    return '';
  }

  save() {
    this.submitted = true;
    this.error.set('');
    const page = this.page();
    if (
      !page ||
      !this.acceptPrivacy ||
      page.fields.some((field) => this.fieldError(field.key, field.required))
    ) {
      if (!this.acceptPrivacy) this.error.set('Acepta el aviso de privacidad para continuar.');
      return;
    }
    const body: RegisterCustomerRequest = {
      ...Object.fromEntries(
        page.fields
          .filter((field) => this.values[field.key].trim())
          .map((field) => [field.key, this.values[field.key].trim()]),
      ),
      acceptPrivacy: true,
      acceptMarketing: this.acceptMarketing,
      website: this.website,
      startedAt: this.startedAt,
    };
    this.submitting.set(true);
    this.api.register(this.code, body).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.success.set(result.message);
        this.existing.set(result.existing);
        this.passes.set(walletButtons(result.passes, this.buttonOrder));
      },
      error: (e) => {
        this.submitting.set(false);
        this.error.set(
          e.status === 409
            ? 'Ya existe un registro con esos datos. Revisa el mensaje de recuperación.'
            : e.status === 429
              ? 'Recibimos muchos intentos. Espera un momento y vuelve a intentar.'
              : e.status === 400
                ? 'Revisa tus datos e intenta de nuevo.'
                : 'No pudimos completar el registro. Intenta de nuevo.',
        );
      },
    });
  }

  copyLink(url: string) {
    void navigator.clipboard?.writeText(url).then(
      () => this.success.set('Enlace copiado.'),
      () => this.error.set('No pudimos copiar el enlace. Mantén presionado para copiarlo.'),
    );
  }
}
