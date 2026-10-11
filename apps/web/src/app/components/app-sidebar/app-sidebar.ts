import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

export interface SidebarItem { label: string; icon: string; href?: string; count?: number; active?: boolean; }
export interface SidebarGroup { label: string; items: SidebarItem[]; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-sidebar.html',
})
export class AppSidebar {
  readonly groups = input<SidebarGroup[]>([]);
  readonly mobileOpen = input(false);
  readonly closeMobile = output<void>();
  readonly signOut = output<void>();
}
