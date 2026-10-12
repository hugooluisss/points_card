import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerListItemDto } from '@points-card/shared';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CustomersService } from './customers.service';

@Component({
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  templateUrl: './customers-list.html',
  styleUrl: './customers-list.scss',
})
export class CustomersList implements OnInit, OnDestroy {
  private readonly api = inject(CustomersService);
  private readonly searchInput = new Subject<string>();
  private readonly destroy = new Subject<void>();
  readonly search = signal('');
  readonly rows = signal<CustomerListItemDto[]>([]);
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit() {
    this.searchInput
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy))
      .subscribe((value) => {
        this.search.set(value);
        this.page.set(1);
        this.load();
      });
    this.load();
  }
  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
  }
  onSearch(value: string) {
    this.searchInput.next(value);
  }
  load() {
    this.loading.set(true);
    this.error.set('');
    this.api.list(this.search(), this.page(), this.pageSize).subscribe({
      next: (result) => {
        this.rows.set(result.items);
        this.total.set(result.total);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar los clientes. Intenta de nuevo.');
        this.loading.set(false);
      },
    });
  }
  move(delta: number) {
    this.page.update((p) => p + delta);
    this.load();
  }
  get pages() {
    return Math.max(1, Math.ceil(this.total() / this.pageSize));
  }
  contact(row: CustomerListItemDto) {
    return row.email || row.phone || 'Sin contacto';
  }
}
