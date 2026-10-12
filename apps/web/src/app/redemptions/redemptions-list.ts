import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BranchOptionDto, RedemptionItemDto } from '@points-card/shared';
import { RedemptionsService, RedemptionFilters } from './redemptions.service';

@Component({
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './redemptions-list.html',
  styleUrl: './redemptions-list.scss',
})
export class RedemptionsList implements OnInit {
  private readonly api = inject(RedemptionsService);
  readonly rows = signal<RedemptionItemDto[]>([]);
  readonly branches = signal<BranchOptionDto[]>([]);
  readonly filters = signal<RedemptionFilters>({
    from: '',
    to: '',
    branchId: '',
    page: 1,
    pageSize: 20,
  });
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit() {
    this.api.branches().subscribe({ next: (v) => this.branches.set(v), error: () => {} });
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
        this.error.set('No pudimos cargar los canjes.');
        this.loading.set(false);
      },
    });
  }
  update(key: keyof RedemptionFilters, value: string) {
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
}
