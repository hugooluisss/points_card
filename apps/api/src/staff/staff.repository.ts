import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Branch } from "../branches/entities/branch.entity";
import { StaffUser } from "./entities/staff-user.entity";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { Role } from "@points-card/shared";

@Injectable()
export class StaffRepository extends BaseTenantRepository<StaffUser> {
  constructor(
    @InjectRepository(StaffUser) repository: Repository<StaffUser>,
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    tenant: TenantContext,
  ) {
    super(repository, tenant);
  }
  list() {
    return this.find({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        branchIds: true,
        createdAt: true,
      },
    });
  }
  byId(id: string) {
    return this.findOne({ where: { id } });
  }
  createStaff(input: {
    name: string;
    email: string;
    passwordHash: string;
    role: Role;
    branchIds: string[] | null;
  }) {
    return this.save(this.create({ ...input, isActive: true }));
  }
  async activeOwnerCount() {
    return this.count({ where: { role: Role.Owner, isActive: true } });
  }
  async validBranchIds(ids: string[]) {
    return (
      await this.branches.find({
        where: { id: In(ids), businessId: this.tenantContext.getBusinessId() },
        select: { id: true },
      })
    ).map(({ id }) => id);
  }
  async updateStaff(
    id: string,
    values: Partial<Pick<StaffUser, "isActive" | "role">>,
  ) {
    return this.update({ id }, values);
  }
}
