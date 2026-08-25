import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/validation";

describe("checkout validation", () => {
  it("accepts the four-field inline project challenge without a client price", () => {
    const result = checkoutSchema.safeParse({
      challengeListingId: "target-project",
      email: "founder@example.com",
      quickListing: {
        name: "Peak Project",
        website: "peak.example.com",
        founderHandle: "peakproject",
      },
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.amountDollars).toBeUndefined();
    expect(result.data.quickListing?.website).toBe("https://peak.example.com/");
    expect(result.data.quickListing?.founderHandle).toBe("@peakproject");
  });

  it("requires the server-selected sector for an inline challenge", () => {
    const result = checkoutSchema.safeParse({
      email: "founder@example.com",
      quickListing: {
        name: "Peak Project",
        website: "https://peak.example.com",
        founderHandle: "",
      },
    });

    expect(result.success).toBe(false);
  });
});
