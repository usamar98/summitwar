import { describe, expect, it } from "vitest";
import { isAdminEmail } from "@/lib/domain/authorization";
import { EventDeduplicator, ownerCanManage } from "@/lib/domain/ledger";
import { normalizePublicUrl } from "@/lib/security";

describe("security boundaries", () => {
  it("normalizes safe external URLs and rejects open-redirect schemes", () => {
    expect(normalizePublicUrl("Example.COM/path#tracking")).toBe(
      "https://example.com/path",
    );
    expect(() => normalizePublicUrl("javascript:alert(1)")).toThrow();
    expect(() => normalizePublicUrl("https://user:pass@example.com")).toThrow();
  });
  it("deduplicates clicks inside a time bucket", () => {
    const dedupe = new EventDeduplicator();
    expect(dedupe.record("listing", "visitor", "10:00")).toBe(true);
    expect(dedupe.record("listing", "visitor", "10:00")).toBe(false);
    expect(dedupe.record("listing", "visitor", "11:00")).toBe(true);
  });
  it("authorizes only the matching owner row", () => {
    const rows = [{ ownerId: "owner-a", listingId: "listing-a" }];
    expect(ownerCanManage("owner-a", "listing-a", rows)).toBe(true);
    expect(ownerCanManage("owner-b", "listing-a", rows)).toBe(false);
  });
  it("uses the admin email allowlist", () => {
    process.env.ADMIN_EMAILS = "admin@example.com, ops@example.com";
    expect(isAdminEmail("ADMIN@example.com")).toBe(true);
    expect(isAdminEmail("founder@example.com")).toBe(false);
  });
});
