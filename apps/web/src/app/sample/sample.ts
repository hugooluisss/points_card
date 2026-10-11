import { Component, signal } from '@angular/core';
import { AppHeader } from '../components/app-header/app-header';
import { AppSidebar, SidebarGroup } from '../components/app-sidebar/app-sidebar';
import { DataTable, DataTableColumn } from '../components/data-table/data-table';
import { KpiCard } from '../components/kpi-card/kpi-card';
import { StatusChip } from '../components/status-chip/status-chip';

interface ActivityRow { cliente: string; movimiento: string; estado: string; }

// Dev-only scaffolding: lets developers visually verify shared UI components.
@Component({
  standalone: true,
  imports: [AppHeader, AppSidebar, KpiCard, DataTable, StatusChip],
  template: `
    <div class="min-h-screen lg:flex">
      <app-sidebar [groups]="groups" [mobileOpen]="mobileOpen()" (closeMobile)="mobileOpen.set(false)" />
      <div class="min-w-0 flex-1">
        <app-header [menuOpen]="mobileOpen()" (menuToggle)="mobileOpen.set(!mobileOpen())" />
        <main class="mx-auto max-w-[1500px] px-4 py-8 sm:px-7 lg:px-9">
          <p class="text-sm font-medium text-slate-600">Resumen del negocio</p><h1 class="mt-1 text-3xl font-semibold tracking-tight">Componentes de Points Card</h1><p class="mt-2 text-slate-700">Muestra de los elementos reutilizables del panel.</p>
          <section aria-label="Indicadores de ejemplo" class="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><app-kpi-card title="Clientes" value="248" delta="12 más este mes" color="peach" /><app-kpi-card title="Movimientos" value="1,284" delta="En el periodo" color="green" /><app-kpi-card title="Canjes" value="36" delta="8 más que el mes anterior" color="blue" /><app-kpi-card title="Programas activos" value="3" delta="Listos para tus clientes" color="mint" /></section>
          <section class="mt-7 rounded-card border border-slate-200 bg-white p-5 sm:p-7"><h2 class="text-xl font-semibold">Estados</h2><div class="mt-4 flex flex-wrap gap-3"><app-status-chip variant="in-progress" label="En progreso" /><app-status-chip variant="completed" label="Completado" /><app-status-chip variant="failed" label="Fallido" /></div></section>
          <section class="mt-7"><h2 class="mb-4 text-xl font-semibold">Actividad reciente</h2><app-data-table [columns]="columns" [rows]="rows" /></section>
        </main>
      </div>
    </div>
  `,
})
export class Sample {
  protected readonly mobileOpen = signal(false);
  protected readonly groups: SidebarGroup[] = [
    { label: 'General', items: [{ label: 'Inicio', icon: '⌂', active: true, href: '/sample' }] },
    { label: 'Operación', items: [{ label: 'Clientes', icon: '♧', count: 24 }, { label: 'Movimientos', icon: '⇄', count: 8 }, { label: 'Canjes', icon: '✧', count: 3 }, { label: 'Escáner', icon: '▦' }] },
    { label: 'Lealtad', items: [{ label: 'Programas', icon: '☆' }] },
    { label: 'Administración', items: [{ label: 'Configuración', icon: '⚙' }] },
  ];
  protected readonly columns: DataTableColumn<ActivityRow>[] = [
    { key: 'cliente', label: 'Cliente' }, { key: 'movimiento', label: 'Movimiento' }, { key: 'estado', label: 'Estado' },
  ];
  protected readonly rows: ActivityRow[] = [
    { cliente: 'Ana Pérez', movimiento: 'Sumó 5 puntos', estado: 'Completado' },
    { cliente: 'Luis García', movimiento: 'Canjeó una bebida', estado: 'En progreso' },
    { cliente: 'María López', movimiento: 'Tarjeta actualizada', estado: 'Fallido' },
  ];
}
