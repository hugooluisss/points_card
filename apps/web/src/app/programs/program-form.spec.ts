import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProgramsService } from './programs.service';
import { ProgramForm } from './program-form';

const existingProgram = {
  id: 'program-1',
  name: 'Tarjeta de sellos',
  mode: 'stamps',
  validFrom: '2026-10-01',
  validUntil: null,
  stampsGoal: 5,
  pointsPerCurrencyUnit: null,
  minIntervalMinutes: null,
  maxAccumulationsPerCardPerDay: null,
  maxAccumulationsPerStaffPerDay: null,
  maxPointsPerOperation: null,
  staffDailyAlertThreshold: null,
};

describe('ProgramForm', () => {
  function setup(id: string | null, api: object) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ProgramsService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ProgramForm);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  it('renders anti-fraud controls', () => {
    const { fixture } = setup(null, {});
    expect(fixture.nativeElement.textContent).toContain('Controles antifraude');
  });

  it('re-enables the save button and returns to the list after editing', () => {
    const update = vi.fn(() => of(existingProgram));
    const { fixture, navigate } = setup('program-1', {
      get: () => of(existingProgram),
      update,
    });

    fixture.componentInstance.save();

    expect(update).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/programas']);
  });

  it('opens the new program after creating it and releases the save button', () => {
    const create = vi.fn(() => of({ ...existingProgram, id: 'program-2' }));
    const { fixture, navigate } = setup(null, { create });
    fixture.componentInstance.name = 'Nuevo programa';

    fixture.componentInstance.save();

    expect(create).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/programas', 'program-2']);
  });
});
