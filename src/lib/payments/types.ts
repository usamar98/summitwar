export type CheckoutRequest = {
  paymentId: string;
  listingId: string;
  startupName: string;
  amountCents: number;
  email: string;
};

export type CheckoutResult = {
  checkoutUrl: string;
  providerCheckoutId: string;
};

export interface PaymentProvider {
  readonly name: "stripe" | "development";
  createCheckout(input: CheckoutRequest): Promise<CheckoutResult>;
}
