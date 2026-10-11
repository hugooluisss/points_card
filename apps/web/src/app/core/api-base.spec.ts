import { API_BASE } from './api-base';

describe('API_BASE', () => {
  it('uses the API route prefix', () => {
    expect(API_BASE).toBe('/points-card-api');
  });
});
