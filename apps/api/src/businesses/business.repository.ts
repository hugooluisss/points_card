import { Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Role } from "@points-card/shared";
import { Branch } from "../branches/entities/branch.entity";
import { Business } from "./entities/business.entity";
import { StaffUser } from "../staff/entities/staff-user.entity";
import { Plan } from "../billing/entities/plan.entity";
import { Subscription } from "../billing/entities/subscription.entity";
import { Clock } from "../ledger/clock";

@Injectable()
// Allow-listed: registration creates the tenant, and status/email lookups are global by design.
export class BusinessRepository {
  constructor(
    @InjectRepository(Business)
    private readonly businesses: Repository<Business>,
    @InjectRepository(Branch) private readonly branches: Repository<Branch>,
    @InjectRepository(StaffUser)
    private readonly staffUsers: Repository<StaffUser>,
    private readonly dataSource: DataSource,
    private readonly clock: Clock = new Clock(),
  ) {}

  register(input: {
    businessName: string;
    branchName: string;
    ownerName: string;
    email: string;
    passwordHash: string;
  }) {
    return this.dataSource.transaction(async (manager) => {
      let business: Business;
      do {
        try {
          business = await manager.getRepository(Business).save(
            manager.getRepository(Business).create({
              name: input.businessName,
              publicCode: randomBytes(12).toString("base64url"),
              plan: "trial",
              status: "active",
            }),
          );
          break;
        } catch (error) {
          if (
            (error as { code?: string }).code !== "ER_DUP_ENTRY" ||
            !(error as { sqlMessage?: string }).sqlMessage?.includes(
              "uq_businesses_public_code",
            )
          )
            throw error;
        }
      } while (true);
      const basicPlan = await manager.getRepository(Plan).findOneByOrFail({
        name: "Básico",
        isActive: true,
      });
      const now = this.clock.now();
      await manager.getRepository(Subscription).save({
        businessId: business.id,
        planId: basicPlan.id,
        status: "trial",
        trialEndsAt: new Date(now.getTime() + 14 * 86_400_000),
        createdAt: now,
        updatedAt: now,
      });
      const branch = await manager.getRepository(Branch).save(
        manager.getRepository(Branch).create({
          businessId: business.id,
          name: input.branchName,
          isDefault: true,
        }),
      );
      const owner = await manager.getRepository(StaffUser).save(
        manager.getRepository(StaffUser).create({
          businessId: business.id,
          name: input.ownerName,
          email: input.email,
          passwordHash: input.passwordHash,
          role: Role.Owner,
          isActive: true,
          branchIds: null,
        }),
      );
      return {
        businessId: business.id,
        branchId: branch.id,
        ownerId: owner.id,
      };
    });
  }

  async updateStatus(
    businessId: string,
    status: "active" | "suspended",
  ): Promise<boolean> {
    const result = await this.businesses.update({ id: businessId }, { status });
    return (result.affected ?? 0) > 0;
  }

  async isActive(businessId: string): Promise<boolean> {
    const business = await this.businesses.findOne({
      where: { id: businessId },
      select: { id: true, status: true },
    });
    return business?.status === "active";
  }
}
