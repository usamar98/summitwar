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

export const checkoutSchema = z
  .object({
    listingId: z.string().min(1).optional(),
    amountDollars: z.coerce.number().int().min(1).max(100_000),
    email: z
      .string()
      .trim()
      .email()
      .max(320)
      .transform((value) => value.toLowerCase()),
    target: z.enum(["next", "summit", "custom"]).default("custom"),
    listing: listingInputSchema.optional(),
  })
  .superRefine((value, context) => {
    if (!value.listingId && !value.listing)
      context.addIssue({
        code: "custom",
        path: ["listing"],
        message: "Startup details are required",
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
