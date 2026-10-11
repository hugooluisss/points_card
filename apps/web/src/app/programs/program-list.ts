import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LoyaltyProgramDto, LoyaltyRewardDto } from '@points-card/shared';
import { ProgramsService } from './programs.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './program-list.html',
  styleUrl: './program-list.scss',
})
export class ProgramList implements OnInit {
  private readonly api = inject(ProgramsService);
  readonly programs = signal<LoyaltyProgramDto[]>([]);
  readonly rewardCounts = signal<Record<string, number>>({});
  readonly loading = signal(true);
  readonly error = signal('');
  readonly actionError = signal<Record<string, string>>({});
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.list().subscribe({
      next: (rows) => {
        this.programs.set(rows);
        this.loading.set(false);
        rows.forEach((p) =>
          this.api
            .rewards(p.id)
            .subscribe({
              next: (rewards) =>
                this.rewardCounts.update((counts) => ({
                  ...counts,
                  [p.id]: rewards.filter((r) => r.isActive).length,
                })),
            }),
        );
      },
      error: () => {
        this.error.set('No pudimos cargar los programas. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }
  toggle(p: LoyaltyProgramDto) {
    this.actionError.update((errors) => ({ ...errors, [p.id]: '' }));
    this.api
      .setActive(p.id, p.status !== 'active')
      .subscribe({
        next: () => this.load(),
        error: (e) =>
          this.actionError.update((errors) => ({
            ...errors,
            [p.id]:
              e.status === 409
                ? 'Ya existe un programa activo de esta modalidad para este comercio. Desactívalo antes de activar este.'
                : 'No pudimos cambiar el estado. Intenta de nuevo.',
          })),
      });
  }
  rule(p: LoyaltyProgramDto) {
    return p.mode === 'stamps'
      ? `${p.stampsGoal} sellos · 1 por operación válida`
      : `${p.pointsPerCurrencyUnit} puntos por unidad monetaria`;
  }
  date(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
