import "server-only";

import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");
  client ??= new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
    typescript: true,
    appInfo: { name: "SummitWar", version: "0.1.0" },
  });
  return client;
}

export function hasStripeEnv() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
}
