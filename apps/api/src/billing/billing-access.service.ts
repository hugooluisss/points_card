import { HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../ledger/clock";
import { BillingRepository } from "./billing.repository";

@Injectable()
export class BillingAccessService {
  constructor(
    private readonly billing: BillingRepository,
    private readonly clock: Clock,
    private readonly config: ConfigService,
  ) {}
  async assertWritable(businessId: string) {
    const sub = await this.billing.subscription(businessId);
    if (!sub)
      throw new HttpException(
        "Tu periodo de prueba terminó. Actualiza tu plan para crear nuevos datos.",
        402,
      );
    const now = this.clock.now();
    if (
      sub.status === "active" ||
      (sub.status === "trial" && now <= sub.trialEndsAt) ||
      (sub.status === "past_due" && sub.graceEndsAt && now <= sub.graceEndsAt)
    )
      return;
    if (sub.status === "trial") {
      const graceDays = Number(this.config.get("BILLING_GRACE_DAYS") ?? 7);
      const graceEnd = new Date(
        sub.trialEndsAt.getTime() + graceDays * 86_400_000,
      );
      if (now <= graceEnd) {
        await this.billing.saveSubscription({
          businessId,
          status: "past_due",
          graceEndsAt: graceEnd,
        });
        return;
      }
      await this.billing.saveSubscription({
        businessId,
        status: "past_due",
        graceEndsAt: graceEnd,
      });
    }
    throw new HttpException(
      "Tu acceso para crear datos está pausado. Actualiza tu plan para continuar.",
      402,
    );
  }
}
