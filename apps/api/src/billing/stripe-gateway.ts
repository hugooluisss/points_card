import type Stripe from "stripe";
type StripeEvent = Stripe.Event;

export interface StripeGateway {
  configured(): boolean;
  createCustomer(businessId: string): Promise<string>;
  checkout(
    customerId: string,
    priceId: string,
    businessId: string,
    planId: string,
  ): Promise<string>;
  portal(customerId: string): Promise<string>;
  verify(raw: Buffer, signature: string): StripeEvent;
  retrieveSubscription(id: string): Promise<Stripe.Subscription>;
  createProductPrice(
    name: string,
    amount: number,
    currency: string,
  ): Promise<string>;
}

export const STRIPE_GATEWAY = Symbol("STRIPE_GATEWAY");
