import { Component, input, output } from '@angular/core';

export type KpiColor = 'peach' | 'green' | 'blue' | 'mint';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  templateUrl: './kpi-card.html',
  styleUrl: './kpi-card.scss',
})
export class KpiCard {
  readonly title = input.required<string>();
  readonly value = input.required<string | number>();
  readonly delta = input('');
  readonly color = input<KpiColor>('peach');
  readonly action = output<void>();
}
