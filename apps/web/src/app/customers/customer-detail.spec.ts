import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { CustomerDetail } from './customer-detail';

describe('CustomerDetail', () => {
  it('renders customer detail loading state', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerDetail],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'id' } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomerDetail);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cargando cliente');
  });
});
