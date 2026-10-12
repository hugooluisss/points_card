import { Routes } from '@angular/router';
import { PUBLIC_ROUTES } from './public/public.routes';
import { authGuard, guestGuard, roleGuard, rolesForMenuItem } from './auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login').then((module) => module.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register').then((module) => module.Register),
  },
  ...PUBLIC_ROUTES,
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/app-shell').then((module) => module.AppShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./dashboard/home').then((module) => module.Home),
      },
      {
        path: 'clientes',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Clientes') },
        loadChildren: () =>
          import('./customers/customers.routes').then((module) => module.CUSTOMERS_ROUTES),
      },
      {
        path: 'movimientos',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Movimientos') },
        loadChildren: () =>
          import('./movements/movements.routes').then((module) => module.MOVEMENTS_ROUTES),
      },
      {
        path: 'canjes',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Canjes') },
        loadChildren: () =>
          import('./redemptions/redemptions.routes').then((module) => module.REDEMPTIONS_ROUTES),
      },
      {
        path: 'escaner',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Escáner') },
        loadChildren: () =>
          import('./scanner/scanner.routes').then((module) => module.SCANNER_ROUTES),
      },
      {
        path: 'programas',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Programas') },
        loadChildren: () =>
          import('./programs/programs.routes').then((module) => module.PROGRAMS_ROUTES),
      },
      {
        path: 'sincronizacion',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Sincronización') },
        loadChildren: () => import('./sync/sync.routes').then((module) => module.SYNC_ROUTES),
      },
      {
        path: 'configuracion',
        canActivate: [roleGuard],
        data: { roles: rolesForMenuItem('Configuración') },
        loadChildren: () =>
          import('./settings/settings.routes').then((module) => module.SETTINGS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
