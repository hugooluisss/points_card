import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from './home';

describe('Home', () => {
  it('renders the dashboard summary and next step', async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(Home);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resumen del negocio');
    expect(fixture.nativeElement.textContent).toContain('Configura tu primer programa');
  });
});
