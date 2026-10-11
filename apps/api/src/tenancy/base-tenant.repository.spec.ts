import { TenantContext } from './tenant-context.service';
import { BaseTenantRepository } from './base-tenant.repository';

describe('BaseTenantRepository', () => {
  it('fails without tenant context before issuing a query', () => {
    const repository = { find: jest.fn() } as never;
    const scoped = new BaseTenantRepository(repository, new TenantContext());
    expect(() => scoped.find()).toThrow('Tenant context is required');
    expect((repository as { find: jest.Mock }).find).not.toHaveBeenCalled();
  });

  it('sets the current business on save and insert', async () => {
    const repository = { save: jest.fn((entity) => entity), insert: jest.fn((entity) => entity) } as never;
    const context = new TenantContext();
    const scoped = new BaseTenantRepository(repository, context);
    const saveEntity = { businessId: undefined };
    const insertEntity = { businessId: undefined };

    await new Promise<void>((resolve) => context.run({ businessId: 'business-a' }, () => {
      scoped.save(saveEntity as never);
      scoped.insert(insertEntity as never);
      resolve();
    }));

    expect(saveEntity.businessId).toBe('business-a');
    expect(insertEntity.businessId).toBe('business-a');
    expect((repository as { save: jest.Mock }).save).toHaveBeenCalledWith(saveEntity);
    expect((repository as { insert: jest.Mock }).insert).toHaveBeenCalledWith(insertEntity);
  });

  it('rejects save and insert when entity belongs to another business', () => {
    const repository = { save: jest.fn(), insert: jest.fn() } as never;
    const context = new TenantContext();
    const scoped = new BaseTenantRepository(repository, context);

    context.run({ businessId: 'business-a' }, () => {
      expect(() => scoped.save({ businessId: 'business-b' } as never)).toThrow('Entity businessId does not match tenant context');
      expect(() => scoped.insert({ businessId: 'business-b' } as never)).toThrow('Entity businessId does not match tenant context');
    });

    expect((repository as { save: jest.Mock }).save).not.toHaveBeenCalled();
    expect((repository as { insert: jest.Mock }).insert).not.toHaveBeenCalled();
  });
});
