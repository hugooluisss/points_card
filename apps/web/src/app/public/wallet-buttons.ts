import { RegistrationPass } from '@points-card/shared';
import { WalletDevice } from './device-detection.service';

export function walletButtons(passes: RegistrationPass[], device: WalletDevice) {
  const order = device === 'apple' ? ['apple', 'google'] : ['google', 'apple'];
  return [...passes].sort((a, b) => order.indexOf(a.platform) - order.indexOf(b.platform));
}
