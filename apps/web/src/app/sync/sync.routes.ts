import { Routes } from '@angular/router';

export const SYNC_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./sync').then((module) => module.Sync) },
];
