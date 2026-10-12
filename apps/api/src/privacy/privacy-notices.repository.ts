import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "node:crypto";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { PrivacyNotice } from "./entities/privacy-notice.entity";

@Injectable()
export class PrivacyNoticesRepository extends BaseTenantRepository<PrivacyNotice> {
  constructor(
    @InjectRepository(PrivacyNotice) repository: Repository<PrivacyNotice>,
    tenant: TenantContext,
  ) {
    super(repository, tenant);
  }
  list() {
    return this.find({ order: { version: "DESC" } });
  }
  current() {
    return this.findOne({ where: {}, order: { version: "DESC" } });
  }
  async createVersion(text: string) {
    const businessId = this.tenantContext.getBusinessId();
    const rows = await this.repository.query(
      "SELECT COALESCE(MAX(version), 0) + 1 AS version FROM privacy_notices WHERE business_id = ? FOR UPDATE",
      [businessId],
    );
    const version = Number(rows[0].version);
    return this.save(
      this.create({ id: randomUUID(), businessId, version, text }),
    );
  }
}
