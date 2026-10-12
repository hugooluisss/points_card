import { Routes } from '@angular/router';

export const MOVEMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./movements-list').then((m) => m.MovementsList),
  },
];
