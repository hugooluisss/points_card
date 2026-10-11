import { Component, input } from '@angular/core';

export interface DataTableColumn<T> {
  key: keyof T;
  label: string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.html',
  styleUrl: './data-table.scss',
})
export class DataTable<T extends object> {
  readonly columns = input.required<DataTableColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly emptyText = input('No hay datos para mostrar.');
}
