import "server-only";

import { isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { sanitizePlainText } from "@/lib/security";

const MAX_REDIRECTS = 3;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 3_500;
const USER_AGENT =
  "SummitWar metadata fetcher/1.0 (+https://www.summitwar.lol)";

export type ProjectMetadata = {
  heading: string | null;
  logoUrls: string[];
};

export type ProjectLogoAsset = {
  bytes: Uint8Array;
  contentType: "image/png" | "image/jpeg" | "image/webp" | "image/x-icon";
  extension: "png" | "jpg" | "webp" | "ico";
};

function decodeHtmlEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };
  return value.replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (entity, token: string) => {
      if (token[0] === "#") {
        const hexadecimal = token[1]?.toLowerCase() === "x";
        const number = Number.parseInt(
          token.slice(hexadecimal ? 2 : 1),
          hexadecimal ? 16 : 10,
        );
        return Number.isFinite(number) && number >= 0 && number <= 0x10ffff
          ? String.fromCodePoint(number)
          : entity;
      }
      return named[token.toLowerCase()] ?? entity;
    },
  );
}

function cleanMetadataText(value: string | undefined) {
  if (!value) return null;
  const cleaned = decodeHtmlEntities(
    sanitizePlainText(decodeHtmlEntities(value).replace(/\s+/g, " "), 160),
  );
  return cleaned || null;
}

function tagAttributes(tag: string) {
  const attributes = new Map<string, string>();
  const pattern =
    /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of tag.matchAll(pattern)) {
    const name = match[1]?.toLowerCase();
    if (name) attributes.set(name, match[2] ?? match[3] ?? match[4] ?? "");
  }
  return attributes;
}

function resolveHttpUrl(value: string | undefined, baseUrl: URL) {
  if (!value) return null;
  try {
    const url = new URL(decodeHtmlEntities(value), baseUrl);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

export function extractProjectMetadata(
  html: string,
  pageUrl: string,
): ProjectMetadata {
  const baseUrl = new URL(pageUrl);
  const headings = new Map<string, string>();
  const icons: Array<{ url: string; score: number }> = [];
  const socialImages: string[] = [];

  for (const tag of html.match(/<(?:meta|link)\b[^>]*>/gi) ?? []) {
    const attributes = tagAttributes(tag);
    if (tag.toLowerCase().startsWith("<meta")) {
      const key = (
        attributes.get("property") ??
        attributes.get("name") ??
        ""
      ).toLowerCase();
      const content = attributes.get("content");
      if (
        content &&
        [
          "description",
          "og:description",
          "twitter:description",
          "og:title",
          "twitter:title",
        ].includes(key)
      ) {
        headings.set(key, content);
      }
      if (content && ["og:logo", "og:image", "twitter:image"].includes(key)) {
        const url = resolveHttpUrl(content, baseUrl);
        if (url) socialImages.push(url);
      }
      continue;
    }

    const rel = (attributes.get("rel") ?? "").toLowerCase();
    const url = resolveHttpUrl(attributes.get("href"), baseUrl);
    if (!url || !rel.includes("icon")) continue;
    const sizes = attributes.get("sizes") ?? "";
    const numericSize = Number.parseInt(sizes, 10) || 0;
    const score =
      (rel.includes("apple-touch-icon") ? 500 : rel === "icon" ? 400 : 300) +
      Math.min(numericSize, 256);
    icons.push({ url, score });
  }

  const titleMatch = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  const heading = cleanMetadataText(
    headings.get("og:description") ??
      headings.get("description") ??
      headings.get("twitter:description") ??
      headings.get("og:title") ??
      headings.get("twitter:title") ??
      titleMatch?.[1],
  );
  const logoUrls = [
    ...icons.sort((a, b) => b.score - a.score).map((item) => item.url),
    ...socialImages,
    new URL("/favicon.ico", baseUrl).toString(),
  ].filter((url, index, values) => values.indexOf(url) === index);

  return { heading, logoUrls };
}

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (
    octets.length !== 4 ||
    octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  )
    return false;
  const [a, b] = octets;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && octets[2] === 100) ||
    (a === 203 && b === 0 && octets[2] === 113) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  );
}

export function isPublicIpAddress(address: string) {
  if (isIP(address) === 4) return isPublicIpv4(address);
  if (isIP(address) !== 6) return false;
  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isPublicIpv4(normalized.slice("::ffff:".length));
  }
  return !(
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("::") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:")
  );
}

async function assertPublicDestination(url: URL) {
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  ) {
    throw new Error("Unsupported metadata URL");
  }
  const hostname = url.hostname.toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal")
  ) {
    throw new Error("Private metadata URL");
  }
  const addresses = isIP(hostname)
    ? [{ address: hostname }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (
    !addresses.length ||
    addresses.some((item) => !isPublicIpAddress(item.address))
  ) {
    throw new Error("Private metadata destination");
  }
}

async function fetchPublicResource(input: string, accept: string) {
  let url = new URL(input);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    await assertPublicDestination(url);
    const response = await fetch(url, {
      cache: "no-store",
      redirect: "manual",
      headers: { accept, "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS)
        throw new Error("Invalid metadata redirect");
      url = new URL(location, url);
      continue;
    }
    if (!response.ok)
      throw new Error(`Metadata request failed: ${response.status}`);
    return { response, url };
  }
  throw new Error("Too many metadata redirects");
}

async function readLimitedBytes(response: Response, maximum: number) {
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > maximum) throw new Error("Metadata resource is too large");
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maximum) {
      await reader.cancel();
      throw new Error("Metadata resource is too large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function fetchProjectMetadata(
  websiteUrl: string,
): Promise<ProjectMetadata> {
  try {
    const { response, url } = await fetchPublicResource(
      websiteUrl,
      "text/html,application/xhtml+xml;q=0.9",
    );
    const contentType =
      response.headers.get("content-type")?.toLowerCase() ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml+xml")
    ) {
      return {
        heading: null,
        logoUrls: [new URL("/favicon.ico", url).toString()],
      };
    }
    const bytes = await readLimitedBytes(response, MAX_HTML_BYTES);
    return extractProjectMetadata(
      new TextDecoder().decode(bytes),
      url.toString(),
    );
  } catch {
    return { heading: null, logoUrls: [] };
  }
}

function normalizeImageType(contentType: string | null) {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase();
  if (normalized === "image/png")
    return { contentType: normalized, extension: "png" } as const;
  if (normalized === "image/jpeg" || normalized === "image/jpg")
    return { contentType: "image/jpeg", extension: "jpg" } as const;
  if (normalized === "image/webp")
    return { contentType: normalized, extension: "webp" } as const;
  if (
    normalized === "image/x-icon" ||
    normalized === "image/vnd.microsoft.icon"
  )
    return { contentType: "image/x-icon", extension: "ico" } as const;
  return null;
}

export async function fetchProjectLogoAsset(
  logoUrls: string[],
  maximumBytes = MAX_LOGO_BYTES,
): Promise<ProjectLogoAsset | null> {
  for (const logoUrl of logoUrls.slice(0, 6)) {
    try {
      const { response } = await fetchPublicResource(
        logoUrl,
        "image/png,image/jpeg,image/webp,image/x-icon;q=0.9",
      );
      const imageType = normalizeImageType(
        response.headers.get("content-type"),
      );
      if (!imageType) continue;
      const bytes = await readLimitedBytes(response, maximumBytes);
      if (!bytes.byteLength) continue;
      return { bytes, ...imageType };
    } catch {
      // Try the next declared icon or social image.
    }
  }
  return null;
}
