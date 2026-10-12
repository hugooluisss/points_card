import { Routes } from '@angular/router';

export const CUSTOMERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers-list').then((m) => m.CustomersList),
  },
  { path: ':id', loadComponent: () => import('./customer-detail').then((m) => m.CustomerDetail) },
];
