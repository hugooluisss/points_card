import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RegistrationFieldConfig,
  RegistrationFieldKey,
  RegistrationSettingsDto,
} from '@points-card/shared';
import { RegistrationService } from '../public/registration.service';

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './registration-settings.html',
  styleUrl: './registration-settings.scss',
})
export class RegistrationSettings implements OnInit {
  private readonly api = inject(RegistrationService);
  readonly settings = signal<RegistrationSettingsDto | null>(null);
  readonly notice = signal<{ version: number; text: string; createdAt: string } | null>(null);
  readonly qr = signal('');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  noticeText = '';
  submitted = false;
  readonly keys: { key: RegistrationFieldKey; label: string }[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'email', label: 'Correo electrónico' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'birthday', label: 'Fecha de nacimiento' },
  ];

  ngOnInit() {
    this.api.settings().subscribe({
      next: (settings) => {
        this.settings.set(settings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar la configuración.');
        this.loading.set(false);
      },
    });
    this.api.privacyNotice().subscribe({
      next: (notice) => {
        this.notice.set(notice);
        this.noticeText = notice.text;
      },
    });
    this.api
      .registrationQr()
      .subscribe({ next: (qr) => this.qr.set(`data:image/svg+xml,${encodeURIComponent(qr)}`) });
  }

  field(key: RegistrationFieldKey) {
    return this.settings()?.fields.find((field) => field.key === key);
  }

  toggle(key: RegistrationFieldKey) {
    const current = this.settings();
    if (!current) return;
    if (
      key === 'name' ||
      (this.field(key)?.required &&
        (key === 'email' || key === 'phone') &&
        !current.fields.some(
          (field) =>
            (field.key === 'email' || field.key === 'phone') && field.required && field.key !== key,
        ))
    )
      return;
    const fields = current.fields.filter((field) => field.key !== key);
    if (!current.fields.some((field) => field.key === key)) fields.push({ key, required: false });
    this.settings.set({ ...current, fields });
  }

  required(key: RegistrationFieldKey, required: boolean) {
    const current = this.settings();
    if (!current) return;
    if (
      (key === 'name' && !required) ||
      (!required &&
        (key === 'email' || key === 'phone') &&
        !current.fields.some(
          (field) =>
            (field.key === 'email' || field.key === 'phone') && field.required && field.key !== key,
        ))
    )
      return;
    this.settings.set({
      ...current,
      fields: current.fields.map((field) => (field.key === key ? { ...field, required } : field)),
    });
  }

  valid(settings = this.settings()) {
    const fields = settings?.fields ?? [];
    return (
      fields.some((field) => field.key === 'name') &&
      fields.some((field) => (field.key === 'email' || field.key === 'phone') && field.required) &&
      (!settings?.brandColor || /^#[\da-fA-F]{6}$/.test(settings.brandColor))
    );
  }

  save() {
    this.submitted = true;
    this.error.set('');
    this.success.set('');
    const settings = this.settings();
    if (!settings || !this.valid(settings)) {
      this.error.set(
        'Incluye el nombre y un correo o teléfono obligatorio; revisa también el color.',
      );
      return;
    }
    this.saving.set(true);
    this.api
      .saveSettings({
        fields: settings.fields,
        brandColor: settings.brandColor,
        logoUrl: settings.logoUrl,
      })
      .subscribe({
        next: (saved) => {
          this.settings.set(saved);
          this.saving.set(false);
          this.success.set('Configuración guardada.');
        },
        error: () => {
          this.saving.set(false);
          this.error.set('No pudimos guardar la configuración. Intenta de nuevo.');
        },
      });
  }

  publishNotice() {
    if (!this.noticeText.trim()) return;
    if (
      !confirm(
        'Se publicará una nueva versión del aviso y aplicará a los registros posteriores. ¿Continuar?',
      )
    )
      return;
    this.api.publishPrivacyNotice(this.noticeText.trim()).subscribe({
      next: (notice) => {
        this.notice.set(notice);
        this.success.set('Nueva versión del aviso publicada.');
      },
      error: () => this.error.set('No pudimos publicar el aviso. Intenta de nuevo.'),
    });
  }
}
