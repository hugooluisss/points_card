import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { SyncService, FailedSyncJob } from './sync.service';

@Component({
  standalone: true,
  imports: [DatePipe],
  templateUrl: './sync.html',
  styleUrl: './sync.scss',
})
export class Sync implements OnInit, OnDestroy {
  private readonly service = inject(SyncService);
  readonly jobs = signal<FailedSyncJob[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly retrying = signal(new Set<string>());
  readonly retryErrors = signal<Record<string, string>>({});
  private timer?: ReturnType<typeof setInterval>;

  ngOnInit() {
    this.refresh();
    this.timer = setInterval(() => {
      if (!document.hidden) this.refresh();
    }, 30_000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  refresh() {
    this.loading.set(true);
    this.error.set('');
    this.service.failed().subscribe({
      next: (jobs) => {
        this.jobs.set(jobs);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las sincronizaciones. Inténtalo de nuevo.');
        this.loading.set(false);
      },
    });
  }

  retry(job: FailedSyncJob) {
    this.retrying.update((ids) => new Set(ids).add(job.id));
    this.retryErrors.update((errors) => ({ ...errors, [job.id]: '' }));
    this.service.retry(job.id).subscribe({
      next: () => {
        this.jobs.update((jobs) => jobs.filter(({ id }) => id !== job.id));
        this.retrying.update((ids) => {
          const next = new Set(ids);
          next.delete(job.id);
          return next;
        });
        this.refresh();
      },
      error: () => {
        this.retryErrors.update((errors) => ({
          ...errors,
          [job.id]: 'No se pudo solicitar el reintento. Inténtalo de nuevo.',
        }));
        this.retrying.update((ids) => {
          const next = new Set(ids);
          next.delete(job.id);
          return next;
        });
      },
    });
  }

  platformName(platform: string) {
    return platform.toLowerCase().includes('apple')
      ? 'Apple Wallet'
      : platform.toLowerCase().includes('google')
        ? 'Google Wallet'
        : platform;
  }
  maskedAccount(accountId: string) {
    return `•••• ${accountId.slice(-6)}`;
  }
  maskedCard(cardCode?: string) {
    return cardCode ? `•••• ${cardCode.slice(-4)}` : 'Identificador de tarjeta no disponible';
  }
}
