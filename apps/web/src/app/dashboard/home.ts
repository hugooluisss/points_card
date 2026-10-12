import { SlicePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ActivityItemDto,
  DashboardPeriod,
  DashboardSummaryDto,
  MetricsDto,
} from '@points-card/shared';
import { AuthService } from '../auth/auth.service';
import { KpiCard } from '../components/kpi-card/kpi-card';
import { BranchOptionDto } from '@points-card/shared';
import { DashboardService } from './dashboard.service';

@Component({
  standalone: true,
  imports: [RouterLink, KpiCard, SlicePipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {
  private readonly api = inject(DashboardService);
  private readonly auth = inject(AuthService);
  readonly period = signal<DashboardPeriod>('30d');
  readonly summary = signal<DashboardSummaryDto | null>(null);
  readonly metrics = signal<MetricsDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly branchId = signal('');
  readonly branches = signal<BranchOptionDto[]>([]);
  readonly canFilterBranch = computed(() => !this.auth.user()?.branchIds?.length);
  readonly maxOperations = computed(() =>
    Math.max(1, ...(this.summary()?.operationsPerDay.map((d) => d.count) ?? [])),
  );
  ngOnInit() {
    if (this.canFilterBranch())
      this.api.branches().subscribe({ next: (rows) => this.branches.set(rows), error: () => {} });
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    const branch = this.canFilterBranch() ? this.branchId() || undefined : undefined;
    let done = 0;
    const finish = () => {
      if (++done === 2) this.loading.set(false);
    };
    this.api.summary(this.period(), branch).subscribe({
      next: (value) => {
        this.summary.set(value);
        finish();
      },
      error: () => {
        this.error.set('No pudimos cargar el resumen. Intenta de nuevo.');
        finish();
      },
    });
    this.api.metrics(this.period(), branch).subscribe({
      next: (value) => {
        this.metrics.set(value);
        finish();
      },
      error: () => {
        this.error.set('No pudimos cargar las métricas. Intenta de nuevo.');
        finish();
      },
    });
  }
  changePeriod(value: string) {
    this.period.set(value as DashboardPeriod);
    this.load();
  }
  changeBranch(value: string) {
    this.branchId.set(value);
    this.load();
  }
  delta(kpi: { value: number; previous: number }) {
    if (kpi.previous === 0) return 'Sin datos del periodo anterior';
    const change = ((kpi.value - kpi.previous) / kpi.previous) * 100;
    return `${change > 0 ? '↑' : change < 0 ? '↓' : '→'} ${Math.abs(change).toFixed(1)}% vs. periodo anterior`;
  }
  label(type: ActivityItemDto['type']) {
    return { accumulate: 'Acumulación', redeem: 'Canje', adjust: 'Ajuste', reverse: 'Reversión' }[
      type
    ];
  }
  amount(item: ActivityItemDto) {
    return `${item.amount > 0 ? '+' : ''}${item.amount}`;
  }
  date(value: string) {
    return new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  }
  rate(value: number) {
    return `${(value * 100).toFixed(1)}%`;
  }
}
