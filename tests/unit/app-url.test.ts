import { describe, expect, it } from "vitest";
import { resolvePublicAppUrl } from "@/lib/app-url";

describe("public application URL", () => {
  const fallback = "https://summitwar.lol";

  it.each([undefined, "", "   ", "not a URL", "ftp://summitwar.lol"])(
    "uses the fallback for an unusable value: %s",
    (value) => {
      expect(resolvePublicAppUrl(value, fallback).origin).toBe(fallback);
    },
  );

  it("accepts and trims an HTTP or HTTPS URL", () => {
    expect(
      resolvePublicAppUrl("  https://preview.summitwar.lol/path  ", fallback)
        .href,
    ).toBe("https://preview.summitwar.lol/path");
  });
});
