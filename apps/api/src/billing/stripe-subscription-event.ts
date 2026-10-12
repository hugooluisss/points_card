import type Stripe from "stripe";

export function subscriptionEvent(
  event: Stripe.Event,
): Stripe.Subscription | null {
  return event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
    ? (event.data.object as Stripe.Subscription)
    : null;
}
