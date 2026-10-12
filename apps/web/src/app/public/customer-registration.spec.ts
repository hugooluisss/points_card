import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RegistrationService } from './registration.service';
import { CustomerRegistration } from './customer-registration';

describe('CustomerRegistration', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CustomerRegistration],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ publicCode: 'cafe' }) } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('requires privacy acceptance before posting a registration', async () => {
    const fixture = TestBed.createComponent(CustomerRegistration);
    fixture.detectChanges();
    http
      .expectOne((request) => request.url.endsWith('/public/registration/cafe'))
      .flush({
        businessName: 'Café Nube',
        brandColor: null,
        logoUrl: null,
        fields: [
          { key: 'name', required: true },
          { key: 'phone', required: true },
        ],
        privacyNotice: { version: 1, text: 'Aviso vigente' },
      });
    await Promise.resolve();
    expect(fixture.componentInstance.page()?.fields.map((field) => field.key)).toEqual([
      'name',
      'phone',
    ]);
    fixture.componentInstance.values.name = 'Ana';
    fixture.componentInstance.values.phone = '5512345678';
    fixture.componentInstance.save();
    expect(fixture.componentInstance.error()).toContain('Acepta el aviso');
    http.expectNone((request) => request.method === 'POST');
  });

  it('validates email and future birthdays in Spanish', () => {
    const fixture = TestBed.createComponent(CustomerRegistration);
    fixture.componentInstance.submitted = true;
    fixture.componentInstance.values.email = 'invalido';
    fixture.componentInstance.values.birthday = '2999-01-01';
    expect(fixture.componentInstance.fieldError('email', false)).toContain(
      'correo electrónico válido',
    );
    expect(fixture.componentInstance.fieldError('birthday', false)).toContain(
      'no puede ser futura',
    );
  });
});
