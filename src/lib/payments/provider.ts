import "server-only";

import type {
  CheckoutRequest,
  CheckoutResult,
  PaymentProvider,
} from "@/lib/payments/types";
import { getStripeClient, hasStripeEnv } from "@/lib/payments/stripe";

class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe" as const;
  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const session = await getStripeClient().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: input.email,
        client_reference_id: input.paymentId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: input.amountCents,
              product_data: {
                name: `${input.startupName} SummitWar climb`,
                description: `${input.amountCents / 100} USD sponsored climb · 100 metres per dollar`,
              },
            },
            quantity: 1,
          },
        ],
        metadata: {
          summitwar_payment_id: input.paymentId,
          summitwar_listing_id: input.listingId,
        },
        payment_intent_data: {
          metadata: {
            summitwar_payment_id: input.paymentId,
            summitwar_listing_id: input.listingId,
          },
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/checkout?listing=${encodeURIComponent(input.listingId)}&cancelled=1`,
        submit_type: "pay",
        custom_text: {
          submit: {
            message:
              "Sponsored placement. Your live rank is determined only after Stripe confirms payment.",
          },
        },
      },
      {
        idempotencyKey: `summitwar-checkout-${input.paymentId}`,
      },
    );
    if (!session.url) throw new Error("Stripe did not return a checkout URL");
    return {
      checkoutUrl: session.url,
      providerCheckoutId: session.id,
    };
  }
}

class DevelopmentPaymentProvider implements PaymentProvider {
  readonly name = "development" as const;

  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    return {
      checkoutUrl: `/checkout/success?payment_id=${encodeURIComponent(input.paymentId)}&demo=1`,
      providerCheckoutId: `dev_${input.paymentId}`,
    };
  }
}

export function getPaymentProvider(options?: {
  forceDevelopment?: boolean;
}): PaymentProvider {
  if (options?.forceDevelopment) return new DevelopmentPaymentProvider();
  if (hasStripeEnv()) return new StripePaymentProvider();
  if (process.env.NODE_ENV !== "production")
    return new DevelopmentPaymentProvider();
  throw new Error("Stripe is not configured");
}
