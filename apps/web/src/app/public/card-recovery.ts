import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CardRecoveryDto } from '@points-card/shared';
import { DeviceDetectionService } from './device-detection.service';
import { RegistrationService } from './registration.service';
import { walletButtons } from './wallet-buttons';

@Component({
  standalone: true,
  templateUrl: './card-recovery.html',
  styleUrl: './card-recovery.scss',
})
export class CardRecovery implements OnInit {
  private readonly api = inject(RegistrationService);
  private readonly route = inject(ActivatedRoute);
  private readonly device = inject(DeviceDetectionService);
  readonly card = signal<CardRecoveryDto | null>(null);
  readonly error = signal('');
  readonly loading = signal(true);

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token') ?? '';
    this.api.recover(token).subscribe({
      next: (card) => {
        card.passes = walletButtons(card.passes, this.device.detect());
        this.card.set(card);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(
          e.status === 404 || e.status === 410
            ? 'Este enlace ya se utilizó o venció. Solicita uno nuevo en el negocio.'
            : 'No pudimos recuperar tu tarjeta. Intenta de nuevo.',
        );
        this.loading.set(false);
      },
    });
  }
}
