import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { CardLookupResponse } from '@points-card/shared';
import { Subscription } from 'rxjs';
import { CameraScanner } from './camera-scanner';
import { ScannerService } from './scanner.service';

type Operation =
  | { type: 'stamp' }
  | { type: 'points'; amount: number }
  | { type: 'redeem'; rewardId: string; name: string; cost: number };

@Component({
  standalone: true,
  imports: [FormsModule],
  templateUrl: './scanner.html',
  styleUrl: './scanner.scss',
})
export class Scanner implements OnDestroy {
  @ViewChild('video') private video?: ElementRef<HTMLVideoElement>;
  private readonly api = inject(ScannerService);
  private readonly camera = inject(CameraScanner);
  private readonly auth = inject(AuthService);
  private stopCameraStream?: () => void;
  private request?: Subscription;
  code = '';
  purchaseAmount?: number;
  readonly card = signal<CardLookupResponse | null>(null);
  readonly operation = signal<Operation | null>(null);
  readonly result = signal<{ balance: number } | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly retryable = signal(false);
  readonly cameraActive = signal(false);
  readonly cameraMessage = signal('Activa la cámara o ingresa el código manualmente.');

  async startCamera() {
    this.stopCamera();
    try {
      this.stopCameraStream = await this.camera.start(this.video!.nativeElement, (value) => {
        this.stopCamera();
        this.code = value;
        this.lookup();
      });
      this.cameraActive.set(true);
    } catch {
      this.cameraMessage.set('No se pudo usar la cámara. Ingresa el código manualmente.');
    }
  }

  lookup() {
    if (!this.code.trim() || this.loading()) return;
    this.stopCamera();
    this.loading.set(true);
    this.error.set('');
    this.request?.unsubscribe();
    this.request = this.api.card(this.code.trim()).subscribe({
      next: (card) => {
        this.card.set(card);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err));
        this.loading.set(false);
      },
    });
  }

  choose(operation: Operation) {
    this.operation.set(operation);
    this.error.set('');
    this.retryable.set(false);
  }
  operationLabel() {
    const op = this.operation();
    return op?.type === 'stamp'
      ? 'Agregar un sello'
      : op?.type === 'points'
        ? 'Agregar puntos'
        : op
          ? `Canjear ${op.name}`
          : '';
  }
  operationSummary() {
    const op = this.operation();
    return op?.type === 'stamp'
      ? `Progreso después: ${this.card()!.progress + 1} / ${this.card()!.goal}`
      : op?.type === 'points'
        ? `Importe: $${op.amount} · Los puntos los calcula el servidor`
        : op
          ? `Costo: ${op.cost}`
          : '';
  }
  confirm(retry = false) {
    const op = this.operation();
    const card = this.card();
    if (!op || !card || this.loading()) return;
    if (!retry) this.idempotencyKey = crypto.randomUUID();
    this.loading.set(true);
    this.error.set('');
    this.retryable.set(false);
    const user = this.auth.user();
    const branch = user?.branchIds?.length ? { branchId: user.branchIds[0] } : {};
    const request =
      op.type === 'redeem'
        ? this.api.redeem({
            cardCode: card.cardCode,
            ...branch,
            rewardId: op.rewardId,
            idempotencyKey: this.idempotencyKey,
          } as Parameters<ScannerService['redeem']>[0])
        : this.api.accumulate({
            cardCode: card.cardCode,
            ...branch,
            ...(op.type === 'points' ? { purchaseAmount: op.amount } : {}),
            idempotencyKey: this.idempotencyKey,
          } as Parameters<ScannerService['accumulate']>[0]);
    this.request?.unsubscribe();
    this.request = request.subscribe({
      next: ({ transaction }) => {
        this.result.set({ balance: transaction.balance });
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(this.message(err));
        this.retryable.set(
          !(err instanceof HttpErrorResponse) || err.status === 0 || err.status >= 500,
        );
        this.loading.set(false);
      },
    });
  }

  cancel() {
    this.operation.set(null);
    this.error.set('');
    this.retryable.set(false);
  }
  reset() {
    this.card.set(null);
    this.operation.set(null);
    this.result.set(null);
    this.error.set('');
    this.code = '';
    this.purchaseAmount = undefined;
    this.idempotencyKey = '';
  }
  ngOnDestroy() {
    this.stopCamera();
    this.request?.unsubscribe();
  }

  private idempotencyKey = '';
  private stopCamera() {
    this.stopCameraStream?.();
    this.stopCameraStream = undefined;
    this.cameraActive.set(false);
  }
  private message(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = error.error?.message;
      if (typeof apiMessage === 'string') return apiMessage;
      if (Array.isArray(apiMessage)) return apiMessage.join(' ');
      if (error.status === 404) return 'Tarjeta no encontrada.';
      if (error.status === 0) return 'Se perdió la conexión. Reintenta la operación.';
    }
    return 'No pudimos completar la solicitud. Inténtalo de nuevo.';
  }
}
