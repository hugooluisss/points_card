import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./billing').then((module) => module.Billing) },
];
