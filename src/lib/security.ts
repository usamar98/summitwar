import { createHmac, timingSafeEqual } from "node:crypto";
import sanitizeHtml from "sanitize-html";

const BOT_PATTERN =
  /bot|crawler|spider|headless|preview|slurp|facebookexternalhit/i;

export function normalizePublicUrl(input: string) {
  const candidate = input.trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol))
    throw new Error("Only HTTP(S) URLs are allowed");
  if (url.username || url.password)
    throw new Error("Credentials are not allowed in URLs");
  if (!url.hostname || url.hostname === "localhost")
    throw new Error("A public hostname is required");
  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  if (url.pathname === "/") url.pathname = "";
  return url.toString();
}

export function sanitizePlainText(input: string, maxLength = 5000) {
  return sanitizeHtml(input, { allowedTags: [], allowedAttributes: {} })
    .trim()
    .slice(0, maxLength);
}

export function isKnownBot(userAgent: string | null) {
  return !userAgent || BOT_PATTERN.test(userAgent);
}

export function visitorFingerprint(headers: Headers, context: string) {
  const salt = process.env.VISITOR_FINGERPRINT_SALT;
  if (!salt || salt.length < 32) return null;
  const forwarded =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const material = [forwarded, headers.get("user-agent") ?? "", context].join(
    "|",
  );
  return createHmac("sha256", salt).update(material).digest("hex");
}

export function safeSecretMatch(
  actual: string | null,
  expected: string | undefined,
) {
  if (!actual || !expected) return false;
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const memoryBuckets = new Map<string, { count: number; resetsAt: number }>();

export function allowInMemoryRequest(
  key: string,
  limit: number,
  windowSeconds: number,
) {
  const now = Date.now();
  const current = memoryBuckets.get(key);
  if (!current || current.resetsAt <= now) {
    memoryBuckets.set(key, { count: 1, resetsAt: now + windowSeconds * 1000 });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
