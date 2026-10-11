import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProgramsService } from './programs.service';
import { ProgramList } from './program-list';
import { ProgramForm } from './program-form';
import { Rewards } from './rewards';

describe('Programs screens', () => {
  const api = {
    list: () => of([]),
    get: () =>
      of({
        id: 'p1',
        name: 'Programa',
        mode: 'stamps',
        status: 'inactive',
        validFrom: '2026-01-01',
        validUntil: null,
        stampsGoal: 10,
      }),
    rewards: () => of([]),
    setActive: () => of({}),
    create: () => of({ id: 'p1' }),
    update: () => of({ id: 'p1' }),
    createReward: () => of({}),
    updateReward: () => of({}),
    pauseReward: () => of({}),
  };
  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: ProgramsService, useValue: api }],
    });
  });
  it('shows the empty program state', async () => {
    const f: ComponentFixture<ProgramList> = TestBed.createComponent(ProgramList);
    f.detectChanges();
    await f.whenStable();
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Aún no tienes programas');
  });
  it('renders the program form and reward empty state', async () => {
    const form = TestBed.createComponent(ProgramForm);
    form.detectChanges();
    expect(form.nativeElement.textContent).toContain('Controles antifraude');
    const rewards = TestBed.createComponent(Rewards);
    rewards.detectChanges();
    await rewards.whenStable();
    rewards.detectChanges();
    expect(rewards.nativeElement.textContent).toContain('Aún no hay recompensas');
  });
});
