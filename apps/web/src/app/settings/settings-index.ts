import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '@points-card/shared';
import { AuthService } from '../auth/auth.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './settings-index.html',
  styleUrl: './settings-index.scss',
})
export class SettingsIndex {
  readonly role = inject(AuthService).user()?.role;
  readonly canManageRegistration = this.role === Role.Owner || this.role === Role.Manager;
  readonly canManageBilling = this.role === Role.Owner;
}
