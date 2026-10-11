import { TestBed } from '@angular/core/testing';
import { AntiFraudControls } from './anti-fraud-controls';

describe('AntiFraudControls', () => {
  it('updates a fraud control value', () => {
    const fixture = TestBed.createComponent(AntiFraudControls);
    fixture.componentRef.setInput('fraud', { minIntervalMinutes: null });
    const changed = vi.fn();
    fixture.componentInstance.fraudUpdated.subscribe(changed);
    fixture.componentInstance.update('minIntervalMinutes', 5);
    expect(changed).toHaveBeenCalledWith({ minIntervalMinutes: 5 });
  });
});
