import { z } from "zod";
import { normalizePublicUrl, sanitizePlainText } from "@/lib/security";

export const listingInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => sanitizePlainText(value, 80)),
  tagline: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .transform((value) => sanitizePlainText(value, 160)),
  description: z
    .string()
    .trim()
    .min(20)
    .max(5000)
    .transform((value) => sanitizePlainText(value, 5000)),
  website: z
    .string()
    .trim()
    .transform((value, context) => {
      try {
        return normalizePublicUrl(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "Enter a valid public website URL",
        });
        return z.NEVER;
      }
    }),
  founderName: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .transform((value) => sanitizePlainText(value, 100)),
  founderHandle: z
    .string()
    .trim()
    .max(32)
    .regex(/^@?[A-Za-z0-9_]{1,30}$/)
    .transform((value) => (value.startsWith("@") ? value : `@${value}`)),
  category: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .transform((value) => sanitizePlainText(value, 64)),
  launchYear: z.coerce
    .number()
    .int()
    .min(1980)
    .max(new Date().getUTCFullYear()),
});

export const quickListingInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) => sanitizePlainText(value, 80)),
  website: z
    .string()
    .trim()
    .transform((value, context) => {
      try {
        return normalizePublicUrl(value);
      } catch {
        context.addIssue({
          code: "custom",
          message: "Enter a valid public project link",
        });
        return z.NEVER;
      }
    }),
  founderHandle: z
    .string()
    .trim()
    .max(32)
    .refine(
      (value) => value === "" || /^@?[A-Za-z0-9_]{1,30}$/.test(value),
      "Enter a valid X handle",
    )
    .transform((value) =>
      value && !value.startsWith("@") ? `@${value}` : value,
    ),
});

export const checkoutSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    challengeListingId: z.string().min(1).optional(),
    amountDollars: z.coerce.number().int().min(1).max(100_000).optional(),
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((value) => value.toLowerCase()),
    target: z.enum(["next", "summit", "custom"]).default("custom"),
    listing: listingInputSchema.optional(),
    quickListing: quickListingInputSchema.optional(),
  })
  .superRefine((value, context) => {
    if (!value.listingId && !value.listing && !value.quickListing)
      context.addIssue({
        code: "custom",
        path: ["listing"],
        message: "Startup details are required",
      });
    if (value.quickListing && !value.challengeListingId)
      context.addIssue({
        code: "custom",
        path: ["challengeListingId"],
        message: "A project sector is required",
      });
    if (value.quickListing && (value.listing || value.listingId))
      context.addIssue({
        code: "custom",
        path: ["quickListing"],
        message: "Choose one listing flow",
      });
    if (!value.quickListing && value.amountDollars === undefined)
      context.addIssue({
        code: "custom",
        path: ["amountDollars"],
        message: "A climb amount is required",
      });
  });

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 60) || "startup"
  );
}
