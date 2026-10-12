import { HttpErrorResponse } from '@angular/common/http';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BillingOverviewDto, PlanDto, SubscriptionStatus } from '@points-card/shared';
import { StatusChip, StatusVariant } from '../components/status-chip/status-chip';
import { BillingNavigator } from './billing-navigator';
import { BillingService } from './billing.service';

@Component({
  standalone: true,
  imports: [StatusChip, DatePipe, DecimalPipe],
  templateUrl: './billing.html',
  styleUrl: './billing.scss',
})
export class Billing implements OnInit {
  private readonly api = inject(BillingService);
  private readonly navigator = inject(BillingNavigator);
  private readonly route = inject(ActivatedRoute);
  readonly overview = signal<BillingOverviewDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly actionLoading = signal(false);
  readonly returnStatus = signal('');

  ngOnInit(): void {
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success')
      this.returnStatus.set('Regresaste de Stripe. Estamos confirmando tu suscripción.');
    if (checkout === 'canceled')
      this.returnStatus.set('El pago se canceló. Tu plan no ha cambiado.');
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.overview().subscribe({
      next: (overview) => {
        this.overview.set(overview);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tu plan. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: SubscriptionStatus): string {
    return { trial: 'Prueba', active: 'Activa', past_due: 'En mora', canceled: 'Cancelada' }[
      status
    ];
  }

  statusVariant(status: SubscriptionStatus): StatusVariant {
    return status === 'active'
      ? 'completed'
      : status === 'past_due' || status === 'canceled'
        ? 'failed'
        : 'in-progress';
  }

  trialDays(endsAt: string | null): number {
    return endsAt
      ? Math.max(0, Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000))
      : 0;
  }

  usagePercent(usage: number, limit: number): number {
    return limit > 0 ? Math.min(100, Math.round((usage / limit) * 100)) : 100;
  }

  usageClass(usage: number, limit: number): string {
    const percent = this.usagePercent(usage, limit);
    return percent >= 100 ? 'bg-rose-600' : percent >= 80 ? 'bg-amber-500' : 'bg-teal-700';
  }

  usageTone(usage: number, limit: number): string {
    const percent = this.usagePercent(usage, limit);
    return percent >= 100 ? 'text-rose-700' : percent >= 80 ? 'text-amber-700' : 'text-slate-600';
  }

  choose(plan: PlanDto): void {
    this.action(plan.id, () => this.api.checkout(plan.id));
  }

  manage(): void {
    this.action('', () => this.api.portal());
  }

  private action(_planId: string, request: () => ReturnType<BillingService['portal']>): void {
    this.actionLoading.set(true);
    this.actionError.set('');
    request().subscribe({
      next: ({ url }) => {
        this.navigator.go(url);
        this.actionLoading.set(false);
      },
      error: (err: unknown) => {
        this.actionError.set(
          err instanceof HttpErrorResponse && err.status === 0
            ? 'Se perdió la conexión. Inténtalo de nuevo.'
            : 'No pudimos abrir Stripe. Inténtalo de nuevo.',
        );
        this.actionLoading.set(false);
      },
    });
  }
}
