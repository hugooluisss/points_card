import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProgramsService } from './programs.service';
import { Rewards } from './rewards';

describe('Rewards', () => {
  it('shows empty reward state', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: ProgramsService,
          useValue: {
            get: () => of({ id: 'p', name: 'P', mode: 'stamps', stampsGoal: 10 }),
            rewards: () => of([]),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(Rewards);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay recompensas');
  });
});
