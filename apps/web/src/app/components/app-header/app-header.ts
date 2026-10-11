import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss',
})
export class AppHeader {
  readonly business = input('Café Nube');
  readonly section = input('Panel');
  readonly userName = input('Lucía Morales');
  readonly userRole = input('Propietaria');
  readonly menuOpen = input(false);
  readonly menuToggle = output<void>();
  readonly signOut = output<void>();
  protected readonly userMenuOpen = signal(false);
  protected initials() {
    return this.userName()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
