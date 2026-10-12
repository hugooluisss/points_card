import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MovementsList } from './movements-list';

describe('MovementsList', () => {
  it('shows empty results with filters', async () => {
    await TestBed.configureTestingModule({
      imports: [MovementsList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(MovementsList);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/points-card-api/branches').flush([]);
    http.expectOne('/points-card-api/staff/options').flush([]);
    http
      .expectOne((r) => r.url.endsWith('/movements'))
      .flush({ items: [], total: 0, page: 1, pageSize: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay movimientos');
  });
});
