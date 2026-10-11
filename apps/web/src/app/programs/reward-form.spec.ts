import { TestBed } from '@angular/core/testing';
import { RewardForm } from './reward-form';

describe('RewardForm', () => {
  it('emits save from form submission', () => {
    const fixture = TestBed.createComponent(RewardForm);
    fixture.componentRef.setInput('editing', 'new');
    fixture.componentRef.setInput('mode', 'stamps');
    fixture.detectChanges();
    const save = vi.fn();
    fixture.componentInstance.save.subscribe(save);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    expect(save).toHaveBeenCalled();
  });
});
