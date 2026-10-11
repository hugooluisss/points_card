import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AntiFraudControls } from './anti-fraud-controls';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LoyaltyMode, LoyaltyProgramDto } from '@points-card/shared';
import { ProgramsService, ProgramInput } from './programs.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, AntiFraudControls],
  templateUrl: './program-form.html',
  styleUrl: './program-form.scss',
})
export class ProgramForm implements OnInit {
  private readonly api = inject(ProgramsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly mode: LoyaltyMode = 'stamps';
  name = '';
  validFrom = new Date().toLocaleDateString('en-CA');
  validUntil = '';
  ruleValue = 10;
  readonly loading = signal(!!this.id);
  readonly loadError = signal('');
  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly fraud = signal<Record<string, number | null>>({
    minIntervalMinutes: null,
    maxAccumulationsPerCardPerDay: null,
    maxAccumulationsPerStaffPerDay: null,
    maxPointsPerOperation: null,
    staffDailyAlertThreshold: null,
  });

  ngOnInit() {
    if (this.id)
      this.api.get(this.id).subscribe({
        next: (p) => {
          this.name = p.name;
          (this as { mode: LoyaltyMode }).mode = p.mode;
          this.validFrom = p.validFrom.slice(0, 10);
          this.validUntil = p.validUntil?.slice(0, 10) ?? '';
          this.ruleValue = Number(p.mode === 'stamps' ? p.stampsGoal : p.pointsPerCurrencyUnit);
          this.fraud.update((fraud) =>
            Object.fromEntries(
              Object.keys(fraud).map((key) => [
                key,
                p[key as keyof LoyaltyProgramDto] as number | null,
              ]),
            ),
          );
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set('No pudimos cargar el programa. Intenta regresar a la lista.');
          this.loading.set(false);
        },
      });
  }
  save() {
    this.submitted.set(true);
    this.error.set('');
    if (
      !this.name.trim() ||
      !this.validFrom ||
      (this.validUntil && this.validUntil < this.validFrom) ||
      !this.ruleValue ||
      this.ruleValue <= 0 ||
      (this.mode === 'stamps' && !Number.isInteger(this.ruleValue)) ||
      Object.values(this.fraud()).some(
        (value) => value !== null && (!Number.isInteger(Number(value)) || Number(value) < 1),
      )
    )
      return;
    const body: ProgramInput = {
      name: this.name.trim(),
      mode: this.mode,
      validFrom: this.validFrom,
      validUntil: this.validUntil || null,
      stampsGoal: this.mode === 'stamps' ? this.ruleValue : null,
      pointsPerCurrencyUnit: this.mode === 'points' ? this.ruleValue : null,
      ...this.fraud(),
    };
    this.saving.set(true);
    (this.id ? this.api.update(this.id, body) : this.api.create(body)).subscribe({
      next: (program) => {
        this.saving.set(false);
        void this.router.navigate(this.id ? ['/programas'] : ['/programas', program.id]);
      },
      error: (e) => {
        this.saving.set(false);
        this.error.set(
          e.status === 409
            ? 'Ya existe un programa activo de esta modalidad para este comercio.'
            : e.error?.message ||
                'No pudimos guardar el programa. Revisa los datos e intenta de nuevo.',
        );
      },
    });
  }
  protected readonly Number = Number;
}
