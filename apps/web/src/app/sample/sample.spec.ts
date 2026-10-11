import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Sample } from './sample';

describe('Sample', () => {
  it('renders each shared component with sample data', async () => {
    await TestBed.configureTestingModule({ imports: [Sample], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(Sample);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-kpi-card').length).toBe(4);
    expect(fixture.nativeElement.querySelectorAll('app-status-chip').length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Ana Pérez');
  });
});
