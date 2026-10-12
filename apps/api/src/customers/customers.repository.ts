import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoyaltyAccount } from "../ledger/entities/loyalty-account.entity";
import { LoyaltyTransaction } from "../ledger/entities/loyalty-transaction.entity";
import { randomUUID } from "node:crypto";
import { BaseTenantRepository } from "../tenancy/base-tenant.repository";
import { TenantContext } from "../tenancy/tenant-context.service";
import { Customer } from "./entities/customer.entity";

@Injectable()
export class CustomersRepository extends BaseTenantRepository<Customer> {
  constructor(
    @InjectRepository(Customer) customers: Repository<Customer>,
    @InjectRepository(LoyaltyAccount)
    private readonly accounts: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyTransaction)
    private readonly transactions: Repository<LoyaltyTransaction>,
    tenant: TenantContext,
  ) {
    super(customers, tenant);
  }
  customer(id: string) {
    return this.findOne({ where: { id } });
  }
  createCustomer(input: {
    name: string;
    email?: string | null;
    phone?: string | null;
    birthday?: string | null;
  }) {
    const email = input.email?.trim().toLowerCase() || null;
    const phone = input.phone?.replace(/\D/g, "") || null;
    return this.save(
      this.create({
        ...input,
        id: randomUUID(),
        name: input.name.trim(),
        email,
        phone,
      }),
    );
  }
  async exportData(id: string) {
    const customer = await this.customer(id);
    if (!customer) return null;
    const accounts = await this.accounts.findBy({
      businessId: this.tenantContext.getBusinessId(),
      customerId: id,
    });
    const movements = await this.transactions.find({
      where: accounts.map(({ id: accountId }) => ({
        businessId: this.tenantContext.getBusinessId(),
        accountId,
      })),
      order: { createdAt: "DESC" },
    });
    return { customer, accounts, movements };
  }
  async anonymize(id: string) {
    const customer = await this.customer(id);
    if (!customer || customer.status === "anonymized") return false;
    await this.update(
      { id },
      {
        name: "Cliente anonimizado",
        email: null,
        phone: null,
        birthday: null,
        status: "anonymized",
        anonymizedAt: new Date(),
      },
    );
    await this.accounts.update(
      { businessId: this.tenantContext.getBusinessId(), customerId: id },
      { status: "disabled" },
    );
    return true;
  }
  async accountSummaries(id: string) {
    return this.accounts.find({
      where: { businessId: this.tenantContext.getBusinessId(), customerId: id },
    });
  }
}
