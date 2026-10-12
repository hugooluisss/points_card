import { Routes } from '@angular/router';

export const REDEMPTIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./redemptions-list').then((m) => m.RedemptionsList),
  },
];
