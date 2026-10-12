import { Injectable } from '@angular/core';

export type WalletDevice = 'apple' | 'google' | 'other';

@Injectable({ providedIn: 'root' })
export class DeviceDetectionService {
  detect(userAgent = globalThis.navigator?.userAgent ?? ''): WalletDevice {
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'apple';
    if (/Android/i.test(userAgent)) return 'google';
    return 'other';
  }
}
