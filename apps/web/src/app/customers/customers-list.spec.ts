import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CustomersList } from './customers-list';

describe('CustomersList', () => {
  it('shows empty state', async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersList],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(CustomersList);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController)
      .expectOne((r) => r.url.endsWith('/customers'))
      .flush({ items: [], total: 0, page: 1, pageSize: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontramos clientes');
  });
});
