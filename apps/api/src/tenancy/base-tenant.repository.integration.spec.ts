import 'reflect-metadata';
import { config } from 'dotenv';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../database/database.options';
import { Business } from '../businesses/entities/business.entity';
import { Branch } from '../branches/entities/branch.entity';
import { TenantContext } from './tenant-context.service';
import { BaseTenantRepository } from './base-tenant.repository';

config();

describe('tenant repository isolation', () => {
  let dataSource: DataSource;
  const businessIds: string[] = [];

  beforeAll(async () => {
    dataSource = new DataSource(databaseOptions(new ConfigService({ ...process.env, NODE_ENV: 'test' })));
    await dataSource.initialize();
    await dataSource.runMigrations();
  });

  afterAll(async () => {
    if (businessIds.length) await dataSource.getRepository(Business).delete(businessIds);
    await dataSource.destroy();
  });

  it('hides B rows and prevents reads, updates and deletes under A context', async () => {
    const businesses = dataSource.getRepository(Business);
    const branches = dataSource.getRepository(Branch);
    const a = await businesses.save(businesses.create({ name: 'Isolation A' }));
    const b = await businesses.save(businesses.create({ name: 'Isolation B' }));
    businessIds.push(a.id, b.id);
    const branchB = await branches.save(branches.create({ businessId: b.id, name: 'B branch', isDefault: true }));
    const context = new TenantContext();
    const scoped = new BaseTenantRepository(branches, context);

    await new Promise<void>((resolve) => context.run({ businessId: a.id }, async () => {
      expect(await scoped.findOne({ where: { id: branchB.id } })).toBeNull();
      expect((await scoped.update({ id: branchB.id }, { name: 'Changed' })).affected).toBe(0);
      expect((await scoped.delete({ id: branchB.id })).affected).toBe(0);
      resolve();
    }));
    expect(await branches.findOneByOrFail({ id: branchB.id })).toMatchObject({ name: 'B branch' });
  });
});
