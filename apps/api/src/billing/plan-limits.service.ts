import { ForbiddenException, Injectable } from "@nestjs/common";
import { BillingRepository } from "./billing.repository";
import { BillingAccessService } from "./billing-access.service";

const labels = {
  staff: "usuarios de equipo",
  cards: "tarjetas",
  branches: "sucursales",
} as const;
@Injectable()
export class PlanLimitsService {
  constructor(
    private readonly billing: BillingRepository,
    private readonly access: BillingAccessService,
  ) {}
  async assertCanCreate(
    resource: keyof typeof labels,
    amount = 1,
    businessId?: string,
  ) {
    businessId ??= this.billing.businessId();
    await this.access.assertWritable(businessId);
    const sub = await this.billing.subscription(businessId);
    const usage = await this.billing.usage(businessId);
    const current = usage[resource];
    const max =
      sub?.plan[
        { staff: "maxStaff", cards: "maxCards", branches: "maxBranches" }[
          resource
        ]
      ];
    if (max === undefined || current + amount > max)
      throw new ForbiddenException(
        `Alcanzaste el límite de ${labels[resource]} de tu plan. Mejora tu plan para continuar.`,
      );
  }
}
