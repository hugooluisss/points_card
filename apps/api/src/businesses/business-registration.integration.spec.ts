import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { databaseOptions } from '../database/database.options';
import { BusinessRepository } from './business.repository';
import { BusinessesService } from './businesses.service';
import { Business } from './entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { StaffUser } from '../staff/entities/staff-user.entity';

config();

describe('business registration and staff uniqueness', () => {
  let dataSource: DataSource;
  let service: BusinessesService;
  const createdEmails: string[] = [];

  beforeAll(async () => {
    dataSource = new DataSource(databaseOptions(new ConfigService({ ...process.env, NODE_ENV: 'test' })));
    await dataSource.initialize();
    await dataSource.runMigrations();
    service = new BusinessesService(new BusinessRepository(
      dataSource.getRepository(Business), dataSource.getRepository(Branch), dataSource.getRepository(StaffUser), dataSource,
    ));
  });

  afterEach(async () => {
    for (const email of createdEmails.splice(0)) await dataSource.getRepository(StaffUser).delete({ email });
  });

  afterAll(async () => { await dataSource.destroy(); });

  it('creates business, default branch and owner atomically, and rejects duplicate global email', async () => {
    const email = `registration-${Date.now()}-${Math.random()}@example.test`;
    createdEmails.push(email);
    const result = await service.register({ businessName: 'Demo', ownerName: 'Owner Example', email, password: 'secure-password' });
    const business = await dataSource.getRepository(Business).findOneByOrFail({ id: result.businessId });
    const branch = await dataSource.getRepository(Branch).findOneByOrFail({ id: result.branchId });
    const staff = await dataSource.getRepository(StaffUser).findOneByOrFail({ id: result.ownerId });
    expect(business).toMatchObject({ status: 'active', plan: 'trial' });
    expect(branch).toMatchObject({ businessId: business.id, isDefault: true, name: 'Demo' });
    expect(staff).toMatchObject({ businessId: business.id, name: 'Owner Example', email, role: 'owner', isActive: true });
    expect(staff.passwordHash).not.toBe('secure-password');
    await expect(service.register({ businessName: 'Another', ownerName: 'Other', email, password: 'secure-password' })).rejects.toMatchObject({ status: 409 });
  });
});
