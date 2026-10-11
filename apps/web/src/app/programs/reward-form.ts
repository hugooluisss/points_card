import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reward-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reward-form.html',
  styleUrl: './reward-form.scss',
})
export class RewardForm {
  readonly editing = input.required<string>();
  readonly mode = input.required<'stamps' | 'points'>();
  readonly stampsGoal = input<number | null>(null);
  readonly name = input('');
  readonly cost = input(1);
  readonly conditions = input('');
  readonly submitted = input(false);
  readonly saving = input(false);
  readonly saveError = input('');
  readonly nameChange = output<string>();
  readonly costChange = output<number>();
  readonly conditionsChange = output<string>();
  readonly save = output<void>();
  readonly cancel = output<void>();
  protected readonly Number = Number;
}
