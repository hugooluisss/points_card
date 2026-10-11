import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { BusinessRepository } from './business.repository';
import { BusinessesService } from './businesses.service';

describe('BusinessesService', () => {
  it('hashes the owner password and uses a generic conflict for duplicate email', async () => {
    const repository = { register: jest.fn().mockRejectedValue({ code: 'ER_DUP_ENTRY' }) } as unknown as BusinessRepository;
    const service = new BusinessesService(repository);
    await expect(service.register({ businessName: 'Shop', ownerName: 'Owner', email: 'X@EXAMPLE.COM', password: 'secure-password' })).rejects.toBeInstanceOf(ConflictException);
    const input = (repository.register as jest.Mock).mock.calls[0][0];
    expect(input.email).toBe('x@example.com');
    expect(await argon2.verify(input.passwordHash, 'secure-password')).toBe(true);
  });

  it('suspends, reactivates, and rejects operations while suspended', async () => {
    let active = true;
    const repository = {
      updateStatus: jest.fn(async (_id, status) => { active = status === 'active'; return true; }),
      isActive: jest.fn(async () => active),
    } as unknown as BusinessRepository;
    const service = new BusinessesService(repository);
    await service.suspend('business-id');
    await expect(service.assertBusinessActive('business-id')).rejects.toBeInstanceOf(ForbiddenException);
    await service.reactivate('business-id');
    await expect(service.assertBusinessActive('business-id')).resolves.toBeUndefined();
  });

  it('reports missing businesses on status changes', async () => {
    const service = new BusinessesService({ updateStatus: jest.fn().mockResolvedValue(false) } as unknown as BusinessRepository);
    await expect(service.suspend('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
