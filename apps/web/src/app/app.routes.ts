import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard, rolesForMenuItem } from './auth/auth.guards';

const placeholder = (title: string) => ({
  path: title === 'Escáner' ? 'escaner' : title.toLowerCase(),
  canActivate: [roleGuard],
  data: { roles: rolesForMenuItem(title) },
  loadComponent: () =>
    import('./dashboard/section-placeholder').then((module) => module.SectionPlaceholder),
  resolve: { title: () => title },
});

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
      placeholder('Clientes'),
      placeholder('Movimientos'),
      placeholder('Canjes'),
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
      { ...placeholder('Configuración'), path: 'configuracion' },
    ],
  },
  { path: '**', redirectTo: '' },
];
