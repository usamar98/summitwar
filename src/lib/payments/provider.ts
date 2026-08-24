import "server-only";

import DodoPayments from "dodopayments";
import type {
  CheckoutRequest,
  CheckoutResult,
  PaymentProvider,
} from "@/lib/payments/types";

class DodoPaymentProvider implements PaymentProvider {
  readonly name = "dodo" as const;
  private readonly client: DodoPayments;

  constructor() {
    this.client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY!,
      environment:
        process.env.DODO_PAYMENTS_ENVIRONMENT === "test_mode"
          ? "test_mode"
          : "live_mode",
    });
  }

  async createCheckout(input: CheckoutRequest): Promise<CheckoutResult> {
    const session = await this.client.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PAYMENTS_PRODUCT_ID!,
          quantity: 1,
          amount: input.amountCents,
        },
      ],
      customer: { email: input.email, name: input.startupName },
      metadata: {
        summitwar_payment_id: input.paymentId,
        summitwar_listing_id: input.listingId,
      },
      return_url:
        process.env.DODO_PAYMENTS_RETURN_URL ??
        `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/checkout?cancelled=1`,
      short_link: true,
    });
    if (!session.checkout_url)
      throw new Error("Dodo Payments did not return a checkout URL");
    return {
      checkoutUrl: session.checkout_url,
      providerCheckoutId: session.session_id,
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

export function getPaymentProvider(): PaymentProvider {
  if (
    process.env.DODO_PAYMENTS_API_KEY &&
    process.env.DODO_PAYMENTS_PRODUCT_ID &&
    process.env.DODO_PAYMENTS_WEBHOOK_KEY
  ) {
    return new DodoPaymentProvider();
  }
  if (process.env.NODE_ENV !== "production")
    return new DevelopmentPaymentProvider();
  throw new Error("Dodo Payments is not configured");
}
