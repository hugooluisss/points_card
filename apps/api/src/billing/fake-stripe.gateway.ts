import { Injectable } from "@nestjs/common";
import Stripe from "stripe";
type StripeEvent = Stripe.Event;
import { StripeGateway } from "./stripe-gateway";

@Injectable()
export class FakeStripeGateway implements StripeGateway {
  private readonly signer = new Stripe("sk_test_fake");
  isConfigured = false;
  customers: string[] = [];
  sessions: {
    customer: string;
    price: string;
    businessId: string;
    planId: string;
  }[] = [];
  portalCustomers: string[] = [];
  remote: Map<string, Stripe.Subscription> = new Map();
  configured() {
    return this.isConfigured;
  }
  async createCustomer(id: string) {
    const value = `cus_${id}`;
    this.customers.push(value);
    return value;
  }
  async checkout(
    customerId: string,
    price: string,
    id: string,
    planId: string,
  ) {
    this.sessions.push({ customer: customerId, price, businessId: id, planId });
    return `https://stripe.example/checkout/${id}`;
  }
  async portal(id: string) {
    this.portalCustomers.push(id);
    return `https://stripe.example/portal/${id}`;
  }
  verify(raw: Buffer, signature: string): StripeEvent {
    return this.signer.webhooks.constructEvent(raw, signature, "whsec_test");
  }
  async retrieveSubscription(id: string): Promise<Stripe.Subscription> {
    const sub = this.remote.get(id);
    if (!sub) throw new Error("No fake subscription configured");
    return sub;
  }
  async createProductPrice(name: string) {
    return `price_${name}`;
  }
  signature(payload: string) {
    return this.signer.webhooks.generateTestHeaderString({
      payload,
      secret: "whsec_test",
    });
  }
}
