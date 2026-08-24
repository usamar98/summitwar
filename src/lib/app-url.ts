export const DEFAULT_PUBLIC_APP_URL = "https://www.summitwar.lol";

function parseHttpUrl(value: string): URL | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

export function resolvePublicAppUrl(
  value: string | undefined,
  fallback = DEFAULT_PUBLIC_APP_URL,
): URL {
  const configuredUrl = value?.trim();
  if (configuredUrl) {
    const parsedUrl = parseHttpUrl(configuredUrl);
    if (parsedUrl) return parsedUrl;
  }

  const fallbackUrl = parseHttpUrl(fallback);
  if (!fallbackUrl) throw new Error("The fallback application URL is invalid");
  return fallbackUrl;
}

export function getPublicAppUrl(fallback?: string): URL {
  return resolvePublicAppUrl(process.env.NEXT_PUBLIC_APP_URL, fallback);
}

export function getPublicAppOrigin(fallback?: string): string {
  return getPublicAppUrl(fallback).origin;
}
