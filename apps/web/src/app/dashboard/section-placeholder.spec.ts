import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { SectionPlaceholder } from './section-placeholder';

describe('SectionPlaceholder', () => {
  it('renders the route title', async () => {
    await TestBed.configureTestingModule({
      imports: [SectionPlaceholder],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { data: { title: 'Clientes' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SectionPlaceholder);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Clientes');
  });
});
