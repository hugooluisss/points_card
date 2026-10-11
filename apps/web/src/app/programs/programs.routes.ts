import { Routes } from '@angular/router';

export const PROGRAMS_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./program-list').then((m) => m.ProgramList) },
  { path: 'nuevo', loadComponent: () => import('./program-form').then((m) => m.ProgramForm) },
  { path: ':id/recompensas', loadComponent: () => import('./rewards').then((m) => m.Rewards) },
  { path: ':id', loadComponent: () => import('./program-form').then((m) => m.ProgramForm) },
];
