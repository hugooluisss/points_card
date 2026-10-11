import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProgramsService } from './programs.service';
import { ProgramList } from './program-list';

describe('ProgramList', () => {
  it('shows the empty state', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProgramsService, useValue: { list: () => of([]) } },
      ],
    });
    const fixture = TestBed.createComponent(ProgramList);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes programas');
  });
});
