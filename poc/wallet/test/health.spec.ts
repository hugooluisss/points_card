import { Test } from '@nestjs/testing';
import { HealthController } from '../src/health.controller';
import { WalletService } from '../src/wallet/wallet.service';

describe('GET /health', () => {
  it('returns status ok', async () => {
    const module = await Test.createTestingModule({ controllers: [HealthController], providers: [{ provide: WalletService, useValue: { health: () => ({ status: 'ok' }) } }] }).compile();
    expect(module.get(HealthController).getHealth()).toEqual({ status: 'ok' });
    await module.close();
  });
});
