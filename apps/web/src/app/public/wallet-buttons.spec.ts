import { RegistrationPass } from '@points-card/shared';
import { walletButtons } from './wallet-buttons';

describe('walletButtons', () => {
  const passes: RegistrationPass[] = [
    { platform: 'google', saveUrl: 'g' },
    { platform: 'apple', saveUrl: 'a' },
  ];

  it('puts the detected device first and keeps both options', () => {
    expect(walletButtons(passes, 'apple').map((pass) => pass.platform)).toEqual([
      'apple',
      'google',
    ]);
    expect(walletButtons(passes, 'google').map((pass) => pass.platform)).toEqual([
      'google',
      'apple',
    ]);
    expect(walletButtons(passes, 'other').map((pass) => pass.platform)).toEqual([
      'google',
      'apple',
    ]);
  });
});
