import { Routes } from '@angular/router';
import { Role } from '@points-card/shared';
import { roleGuard } from '../auth/role.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'registro',
    canActivate: [roleGuard],
    data: { roles: [Role.Owner, Role.Manager] },
    loadComponent: () => import('./registration-settings').then((m) => m.RegistrationSettings),
  },
  {
    path: 'facturacion',
    canActivate: [roleGuard],
    data: { roles: [Role.Owner] },
    loadChildren: () => import('../billing/billing.routes').then((m) => m.BILLING_ROUTES),
  },
  {
    path: '',
    loadComponent: () => import('./settings-index').then((m) => m.SettingsIndex),
  },
];
