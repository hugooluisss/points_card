import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomerDetailDto } from '@points-card/shared';
import { CustomersService } from './customers.service';

@Component({
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './customer-detail.html',
  styleUrl: './customer-detail.scss',
})
export class CustomerDetail implements OnInit {
  private readonly api = inject(CustomersService);
  private readonly route = inject(ActivatedRoute);
  readonly data = signal<CustomerDetailDto | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api.detail(this.route.snapshot.paramMap.get('id')!).subscribe({
      next: (data) => {
        this.data.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar el detalle del cliente.');
        this.loading.set(false);
      },
    });
  }
}
