import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: 'r/:publicCode',
    loadComponent: () => import('./customer-registration').then((m) => m.CustomerRegistration),
  },
  {
    path: 'tarjeta/:token',
    loadComponent: () => import('./card-recovery').then((m) => m.CardRecovery),
  },
];
