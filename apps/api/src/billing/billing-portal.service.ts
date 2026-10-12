import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { BillingRepository } from "./billing.repository";
import { STRIPE_GATEWAY, StripeGateway } from "./stripe-gateway";

@Injectable()
export class BillingPortalService {
  constructor(
    private readonly billing: BillingRepository,
    @Inject(STRIPE_GATEWAY) private readonly stripe: StripeGateway,
  ) {}
  async portal() {
    if (!this.stripe.configured())
      throw new ServiceUnavailableException(
        "El cobro aún no está configurado.",
      );
    const sub = await this.billing.subscription(this.billing.businessId());
    if (!sub?.stripeCustomerId)
      throw new ServiceUnavailableException(
        "Aún no hay un cliente de cobro para este comercio.",
      );
    return { url: await this.stripe.portal(sub.stripeCustomerId) };
  }
}
