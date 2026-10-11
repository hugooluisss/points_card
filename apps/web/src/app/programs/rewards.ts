import { Component, OnInit, inject, signal } from '@angular/core';
import { RewardForm } from './reward-form';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LoyaltyProgramDto, LoyaltyRewardDto } from '@points-card/shared';
import { ProgramsService, RewardInput } from './programs.service';

@Component({
  standalone: true,
  imports: [RewardForm, RouterLink],
  templateUrl: './rewards.html',
  styleUrl: './rewards.scss',
})
export class Rewards implements OnInit {
  private readonly api = inject(ProgramsService);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly program = signal<LoyaltyProgramDto | null>(null);
  readonly rewards = signal<LoyaltyRewardDto[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly editing = signal('');
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly saveError = signal('');
  name = '';
  cost = 1;
  conditions = '';
  protected readonly Number = Number;
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.get(this.id).subscribe({
      next: (p) => {
        this.program.set(p);
        this.api.rewards(this.id).subscribe({
          next: (rows) => {
            this.rewards.set(rows);
            this.loading.set(false);
          },
          error: () => {
            this.error.set('No pudimos cargar las recompensas. Intenta de nuevo.');
            this.loading.set(false);
          },
        });
      },
      error: () => {
        this.error.set('No pudimos cargar el programa. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }
  startCreate() {
    this.name = '';
    this.cost = 1;
    this.conditions = '';
    this.submitted.set(false);
    this.saveError.set('');
    this.editing.set('new');
  }
  startEdit(r: LoyaltyRewardDto) {
    this.name = r.name;
    this.cost = r.cost;
    this.conditions = r.conditions ?? '';
    this.submitted.set(false);
    this.saveError.set('');
    this.editing.set(r.id);
  }
  saveReward() {
    this.submitted.set(true);
    this.saveError.set('');
    const p = this.program();
    if (
      !this.name.trim() ||
      !Number.isInteger(Number(this.cost)) ||
      this.cost < 1 ||
      (p?.mode === 'stamps' && this.cost > (p.stampsGoal ?? 0))
    )
      return;
    const body: RewardInput = {
      name: this.name.trim(),
      cost: Number(this.cost),
      conditions: this.conditions.trim() || null,
    };
    this.saving.set(true);
    const request =
      this.editing() === 'new'
        ? this.api.createReward(this.id, body)
        : this.api.updateReward(this.id, this.editing(), body);
    request.subscribe({
      next: () => {
        this.editing.set('');
        this.saving.set(false);
        this.load();
      },
      error: (e) => {
        this.saving.set(false);
        this.saveError.set(e.error?.message || 'No pudimos guardar la recompensa.');
      },
    });
  }
  pause(r: LoyaltyRewardDto) {
    this.saveError.set('');
    this.api
      .pauseReward(this.id, r.id)
      .subscribe({
        next: () => this.load(),
        error: () => this.saveError.set('No pudimos pausar la recompensa. Intenta de nuevo.'),
      });
  }
}
