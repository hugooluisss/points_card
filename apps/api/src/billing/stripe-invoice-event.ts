import type Stripe from "stripe";

export function invoiceEvent(event: Stripe.Event): Stripe.Invoice | null {
  return event.type === "invoice.paid" ||
    event.type === "invoice.payment_failed"
    ? (event.data.object as Stripe.Invoice)
    : null;
}
