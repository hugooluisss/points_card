import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  ObjectLiteral,
  Repository,
  UpdateResult,
  DeleteResult,
} from "typeorm";
import { TenantContext } from "./tenant-context.service";

function scope<T extends ObjectLiteral>(
  where: FindManyOptions<T>["where"],
  businessId: string,
): FindManyOptions<T>["where"] {
  if (Array.isArray(where))
    return where.map((condition) => ({
      ...condition,
      businessId,
    })) as FindManyOptions<T>["where"];
  return {
    ...(where as object),
    businessId,
  } as unknown as FindManyOptions<T>["where"];
}

export class BaseTenantRepository<
  T extends ObjectLiteral & { businessId?: string },
> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly tenantContext: TenantContext,
  ) {}

  create(partial: DeepPartial<T>): T {
    const businessId = this.tenantContext.getBusinessId();
    const partialBusinessId = (partial as { businessId?: string }).businessId;
    if (partialBusinessId && partialBusinessId !== businessId)
      throw new Error("Entity businessId does not match tenant context");
    return this.repository.create({ ...partial, businessId } as DeepPartial<T>);
  }

  save(entity: T) {
    const businessId = this.tenantContext.getBusinessId();
    if (entity.businessId && entity.businessId !== businessId)
      throw new Error("Entity businessId does not match tenant context");
    entity.businessId = businessId;
    return this.repository.save(entity);
  }

  insert(entity: T) {
    const businessId = this.tenantContext.getBusinessId();
    if (entity.businessId && entity.businessId !== businessId)
      throw new Error("Entity businessId does not match tenant context");
    entity.businessId = businessId;
    return this.repository.insert(entity);
  }

  find(options: FindManyOptions<T> = {}) {
    return this.repository.find({
      ...options,
      where: scope(options.where, this.tenantContext.getBusinessId()),
    });
  }

  findOne(options: FindOneOptions<T>) {
    return this.repository.findOne({
      ...options,
      where: scope(options.where, this.tenantContext.getBusinessId()),
    });
  }

  count(options: FindManyOptions<T> = {}) {
    return this.repository.count({
      ...options,
      where: scope(options.where, this.tenantContext.getBusinessId()),
    });
  }

  findOneBy(criteria: object) {
    return this.repository.findOneBy({
      ...criteria,
      businessId: this.tenantContext.getBusinessId(),
    } as never);
  }

  update(criteria: object, partialEntity: object): Promise<UpdateResult> {
    return this.repository.update(
      { ...criteria, businessId: this.tenantContext.getBusinessId() } as never,
      partialEntity as never,
    );
  }

  delete(criteria: object): Promise<DeleteResult> {
    return this.repository.delete({
      ...criteria,
      businessId: this.tenantContext.getBusinessId(),
    } as never);
  }
}
