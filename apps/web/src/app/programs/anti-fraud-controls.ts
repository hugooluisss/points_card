import { Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-anti-fraud-controls',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './anti-fraud-controls.html',
  styleUrl: './anti-fraud-controls.scss',
})
export class AntiFraudControls {
  readonly fraud = input.required<Record<string, number | null>>();
  readonly submitted = input(false);
  readonly fraudUpdated = output<Record<string, number | null>>();
  readonly controls = [
    {
      key: 'minIntervalMinutes',
      label: 'Intervalo mínimo (minutos)',
      help: 'Tiempo mínimo entre operaciones de una tarjeta.',
    },
    {
      key: 'maxAccumulationsPerCardPerDay',
      label: 'Operaciones por tarjeta al día',
      help: 'Máximo de acumulaciones por tarjeta cada día.',
    },
    {
      key: 'maxAccumulationsPerStaffPerDay',
      label: 'Operaciones por empleado al día',
      help: 'Máximo de acumulaciones registradas por empleado.',
    },
    {
      key: 'maxPointsPerOperation',
      label: 'Puntos máximos por operación',
      help: 'Límite de puntos que puede sumar una operación.',
    },
    {
      key: 'staffDailyAlertThreshold',
      label: 'Aviso diario por empleado',
      help: 'Operaciones que activan un aviso para revisión.',
    },
  ];
  protected readonly Number = Number;
  update(key: string, value: number | null) {
    this.fraudUpdated.emit({ ...this.fraud(), [key]: value });
  }
}
