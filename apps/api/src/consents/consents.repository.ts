import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { Consent } from "./entities/consent.entity";

@Injectable()
export class ConsentsRepository extends BaseTenantRepository<Consent> {
  constructor(
    @InjectRepository(Consent) repository: Repository<Consent>,
    tenant: TenantContext,
  ) {
    super(repository, tenant);
  }
  append(input: Partial<Consent>) {
    return this.save(this.create(input));
  }
  history(customerId: string) {
    return this.find({
      where: { customerId },
      order: { createdAt: "DESC", id: "DESC" },
    });
  }
  async marketingActive(customerId: string, channel: Consent["channel"]) {
    const rows = await this.find({
      where: [
        { customerId, purpose: "marketing", channel },
        { customerId, purpose: "marketing", channel: "all" },
      ],
      order: { createdAt: "DESC", id: "DESC" },
    });
    const latest = new Map<string, Consent>();
    for (const row of rows) {
      const key = row.channel;
      if (!latest.has(key)) latest.set(key, row);
    }
    const specific = latest.get(channel);
    const all = latest.get("all");
    const effective =
      specific?.createdAt &&
      all?.createdAt &&
      all.createdAt > specific.createdAt
        ? all
        : (specific ?? all);
    return effective?.status === "granted";
  }
}
