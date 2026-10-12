import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role } from '@points-card/shared';
import { AuthService } from '../auth/auth.service';
import { SettingsIndex } from './settings-index';

describe('SettingsIndex', () => {
  for (const [role, expected] of [
    [Role.Owner, ['Registro de clientes', 'Plan y facturación']],
    [Role.Manager, ['Registro de clientes']],
    [Role.Cashier, []],
  ] as const) {
    it(`shows allowed cards for ${role}`, async () => {
      await TestBed.configureTestingModule({
        imports: [SettingsIndex],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: { user: () => ({ role }) } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(SettingsIndex);
      fixture.detectChanges();
      expect(
        [...fixture.nativeElement.querySelectorAll('h2')].map((heading: HTMLElement) =>
          heading.textContent?.trim(),
        ),
      ).toEqual(expected);
      TestBed.resetTestingModule();
    });
  }
});
