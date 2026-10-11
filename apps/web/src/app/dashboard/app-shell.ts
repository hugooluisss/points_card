import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Role } from '@points-card/shared';
import { AuthService } from '../auth/auth.service';
import { AppHeader } from '../components/app-header/app-header';
import { AppSidebar } from '../components/app-sidebar/app-sidebar';
import { menuForRole } from './menu';

@Component({
  standalone: true,
  imports: [RouterOutlet, AppHeader, AppSidebar],
  template: `<div class="min-h-screen lg:flex"><app-sidebar [groups]="groups()" [mobileOpen]="mobileOpen()" (closeMobile)="mobileOpen.set(false)" (signOut)="logout()"/><div class="min-w-0 flex-1"><app-header [business]="business()" [userName]="name()" [userRole]="roleLabel()" [menuOpen]="mobileOpen()" (menuToggle)="mobileOpen.set(!mobileOpen())" (signOut)="logout()"/><router-outlet /></div></div>`,
})
export class AppShell {
  private readonly auth = inject(AuthService);
  readonly mobileOpen = signal(false);
  readonly user = this.auth.user;
  readonly name = computed(() => this.user()?.name ?? 'equipo');
  readonly business = computed(() => this.user()?.businessId ?? 'Mi negocio');
  readonly roleLabel = computed(() => ({ [Role.Owner]: 'Propietario', [Role.Manager]: 'Gerente', [Role.Cashier]: 'Cajero' }[this.user()?.role ?? Role.Owner]));
  readonly groups = computed(() => menuForRole(this.user()?.role ?? Role.Owner));
  logout() { this.auth.logout().subscribe(); }
}
