import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivityItemDto, BranchOptionDto, StaffOptionDto } from '@points-card/shared';
import { AuthService } from '../auth/auth.service';
import { CsvDownloadService } from '../core/csv-download.service';
import { MovementFilters, MovementsService } from './movements.service';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './movements-list.html',
  styleUrl: './movements-list.scss',
})
export class MovementsList implements OnInit {
  private readonly api = inject(MovementsService);
  private readonly csv = inject(CsvDownloadService);
  private readonly auth = inject(AuthService);
  readonly rows = signal<ActivityItemDto[]>([]);
  readonly branches = signal<BranchOptionDto[]>([]);
  readonly staff = signal<StaffOptionDto[]>([]);
  readonly filters = signal<MovementFilters>({
    from: '',
    to: '',
    branchId: '',
    staffId: '',
    type: '',
    page: 1,
    pageSize: 20,
  });
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly exportError = signal('');
  readonly canExport = () => this.auth.user()?.role !== 'cashier';
  ngOnInit() {
    this.api.branches().subscribe({ next: (v) => this.branches.set(v), error: () => {} });
    this.api.staff().subscribe({ next: (v) => this.staff.set(v), error: () => {} });
    this.load();
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.filters()).subscribe({
      next: (r) => {
        this.rows.set(r.items);
        this.total.set(r.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los movimientos.');
        this.loading.set(false);
      },
    });
  }
  update(key: keyof MovementFilters, value: string) {
    this.filters.update((f) => ({ ...f, [key]: value, page: 1 }));
    this.load();
  }
  move(delta: number) {
    this.filters.update((f) => ({ ...f, page: f.page + delta }));
    this.load();
  }
  get pages() {
    return Math.max(1, Math.ceil(this.total() / this.filters().pageSize));
  }
  export() {
    const { from, to, branchId } = this.filters();
    this.exportError.set('');
    this.api.export({ from, to, branchId }).subscribe({
      next: (file) => this.csv.save(file, 'movimientos.csv'),
      error: () => this.exportError.set('No se pudo descargar el CSV.'),
    });
  }
  sum() {
    return this.rows().reduce((total, row) => total + row.amount, 0);
  }
}
