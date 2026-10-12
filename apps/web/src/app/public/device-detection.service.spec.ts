import { DeviceDetectionService } from './device-detection.service';

describe('DeviceDetectionService', () => {
  const service = new DeviceDetectionService();

  it('prefers Apple Wallet on iPhone and iPad', () => {
    expect(service.detect('Mozilla iPhone')).toBe('apple');
    expect(service.detect('Mozilla iPad')).toBe('apple');
  });

  it('prefers Google Wallet on Android and offers both elsewhere', () => {
    expect(service.detect('Mozilla Android')).toBe('google');
    expect(service.detect('Mozilla Windows')).toBe('other');
  });
});
