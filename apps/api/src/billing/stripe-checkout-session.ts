import type Stripe from "stripe";

export function checkoutSession(
  event: Stripe.Event,
): Stripe.Checkout.Session | null {
  return event.type === "checkout.session.completed"
    ? (event.data.object as Stripe.Checkout.Session)
    : null;
}
