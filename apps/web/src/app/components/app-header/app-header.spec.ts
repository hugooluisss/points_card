import { TestBed } from '@angular/core/testing';
import { AppHeader } from './app-header';

describe('AppHeader', () => {
  it('shows user identity and opens the user menu', async () => {
    await TestBed.configureTestingModule({ imports: [AppHeader] }).compileComponents();
    const fixture = TestBed.createComponent(AppHeader);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[aria-label="Menú de Lucía Morales"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Lucía Morales');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
  });
});
