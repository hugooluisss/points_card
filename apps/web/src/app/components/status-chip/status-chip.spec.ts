import { TestBed } from '@angular/core/testing';
import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  it('renders its label and status styling', async () => {
    await TestBed.configureTestingModule({ imports: [StatusChip] }).compileComponents();
    const fixture = TestBed.createComponent(StatusChip);
    fixture.componentRef.setInput('variant', 'completed');
    fixture.componentRef.setInput('label', 'Completado');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Completado');
    expect(fixture.nativeElement.querySelector('span').classList.contains('bg-green-100')).toBe(true);
  });
});
