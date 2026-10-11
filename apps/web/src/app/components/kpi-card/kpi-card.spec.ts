import { TestBed } from '@angular/core/testing';
import { KpiCard } from './kpi-card';

describe('KpiCard', () => {
  it('renders its values and emits its corner action', async () => {
    await TestBed.configureTestingModule({ imports: [KpiCard] }).compileComponents();
    const fixture = TestBed.createComponent(KpiCard);
    fixture.componentRef.setInput('title', 'Clientes');
    fixture.componentRef.setInput('value', 24);
    fixture.componentRef.setInput('delta', 'Más 4 este mes');
    let clicked = false;
    fixture.componentInstance.action.subscribe(() => clicked = true);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(fixture.nativeElement.textContent).toContain('24');
    expect(fixture.nativeElement.textContent).toContain('Más 4 este mes');
    expect(clicked).toBe(true);
  });
});
