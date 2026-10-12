import "reflect-metadata";
import { config } from "dotenv";
import { DataSource } from "typeorm";
import Stripe from "stripe";

config({ path: "apps/api/.env", quiet: true });
async function main() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("STRIPE_SECRET_KEY is required");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const source = new DataSource({
    type: "mysql",
    timezone: "Z",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [],
    synchronize: false,
  });
  await source.initialize();
  try {
    const plans = await source.query(
      "SELECT id,name,price_monthly,currency FROM plans " +
        "WHERE is_active=TRUE AND stripe_price_id IS NULL",
    );
    for (const plan of plans) {
      const product = await stripe.products.create({
        name: plan.name,
        metadata: { planId: plan.id },
      });
      const price = await stripe.prices.create({
        product: product.id,
        currency: plan.currency.toLowerCase(),
        unit_amount: Math.round(Number(plan.price_monthly) * 100),
        recurring: { interval: "month" },
      });
      await source.query(
        "UPDATE plans SET stripe_price_id=? WHERE id=? AND stripe_price_id IS NULL",
        [price.id, plan.id],
      );
    }
  } finally {
    await source.destroy();
  }
}
void main();
