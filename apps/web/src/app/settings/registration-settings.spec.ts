import { signal } from '@angular/core';
import { RegistrationSettings } from './registration-settings';

describe('RegistrationSettings', () => {
  it('requires name and a required contact method and validates brand color', () => {
    const fixture = Object.create(RegistrationSettings.prototype) as RegistrationSettings;
    const value = signal({
      fields: [
        { key: 'name', required: true },
        { key: 'email', required: true },
      ],
      brandColor: '#12abef',
      logoUrl: null,
      publicCode: 'c',
      publicUrl: '/r/c',
    });
    (fixture as { settings: typeof value }).settings = value;
    expect(fixture.valid()).toBe(true);
    value.set({
      fields: [
        { key: 'name', required: true },
        { key: 'email', required: false },
      ],
      brandColor: '#zzz',
      logoUrl: null,
      publicCode: 'c',
      publicUrl: '/r/c',
    });
    expect(fixture.valid()).toBe(false);
  });
});
