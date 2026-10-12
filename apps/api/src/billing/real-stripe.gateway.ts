import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
import { StripeGateway } from "./stripe-gateway";

@Injectable()
export class RealStripeGateway implements StripeGateway {
  private readonly stripe?: Stripe;
  constructor(private readonly config: ConfigService) {
    const key = config.get<string>("STRIPE_SECRET_KEY");
    if (key) this.stripe = new Stripe(key);
  }
  configured() {
    return !!this.stripe && !!this.config.get<string>("STRIPE_WEBHOOK_SECRET");
  }
  private api() {
    if (!this.stripe) throw new Error("Stripe not configured");
    return this.stripe;
  }
  async createCustomer(businessId: string) {
    return (await this.api().customers.create({ metadata: { businessId } })).id;
  }
  async checkout(
    customerId: string,
    priceId: string,
    businessId: string,
    planId: string,
  ) {
    const url = (
      await this.api().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${this.config.getOrThrow("BILLING_RETURN_URL")}?checkout=success`,
        cancel_url: `${this.config.getOrThrow("BILLING_RETURN_URL")}?checkout=canceled`,
        client_reference_id: businessId,
        metadata: { businessId, planId },
      })
    ).url;
    if (!url) throw new Error("Stripe checkout did not return a URL");
    return url;
  }
  async portal(customerId: string) {
    return (
      await this.api().billingPortal.sessions.create({
        customer: customerId,
        return_url: this.config.getOrThrow("BILLING_RETURN_URL"),
      })
    ).url;
  }
  verify(raw: Buffer, signature: string): Stripe.Event {
    return this.api().webhooks.constructEvent(
      raw,
      signature,
      this.config.getOrThrow("STRIPE_WEBHOOK_SECRET"),
    );
  }
  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    return this.api().subscriptions.retrieve(id);
  }
  async createProductPrice(name: string, amount: number, currency: string) {
    const product = await this.api().products.create({ name });
    return (
      await this.api().prices.create({
        product: product.id,
        currency: currency.toLowerCase(),
        unit_amount: Math.round(amount * 100),
        recurring: { interval: "month" },
      })
    ).id;
  }
}
