import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RedemptionsList } from './redemptions-list';

describe('RedemptionsList', () => {
  it('shows empty state and date filters', async () => {
    await TestBed.configureTestingModule({
      imports: [RedemptionsList],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(RedemptionsList);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/points-card-api/branches').flush([]);
    http
      .expectOne((r) => r.url.endsWith('/redemptions'))
      .flush({ items: [], total: 0, page: 1, pageSize: 20 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay canjes');
  });
});
