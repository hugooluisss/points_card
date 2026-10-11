import { Component, input } from '@angular/core';

export type StatusVariant = 'in-progress' | 'completed' | 'failed';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  templateUrl: './status-chip.html',
  styleUrl: './status-chip.scss',
})
export class StatusChip {
  readonly variant = input.required<StatusVariant>();
  readonly label = input.required<string>();
}
