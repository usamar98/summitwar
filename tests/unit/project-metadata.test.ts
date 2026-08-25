import { describe, expect, it } from "vitest";
import {
  extractProjectMetadata,
  isPublicIpAddress,
} from "@/lib/project-metadata";

describe("project metadata", () => {
  it("extracts a project heading and resolves the strongest available icon", () => {
    const result = extractProjectMetadata(
      `
        <html>
          <head>
            <title>Acme</title>
            <meta property="og:description" content="Build &amp; ship with Acme.">
            <meta property="og:image" content="/social.png">
            <link rel="icon" sizes="32x32" href="/favicon-32.png">
            <link rel="apple-touch-icon" sizes="180x180" href="/apple.png">
          </head>
        </html>
      `,
      "https://acme.example/products",
    );

    expect(result.heading).toBe("Build & ship with Acme.");
    expect(result.faviconUrls[0]).toBe("https://acme.example/apple.png");
    expect(result.faviconUrls).toContain("https://acme.example/favicon.ico");
    expect(result.faviconUrls).toContain(
      "https://www.google.com/s2/favicons?domain_url=https%3A%2F%2Facme.example&sz=128",
    );
    expect(result.faviconUrls).not.toContain("https://acme.example/social.png");
  });

  it("blocks private and reserved addresses from metadata requests", () => {
    expect(isPublicIpAddress("127.0.0.1")).toBe(false);
    expect(isPublicIpAddress("10.0.0.8")).toBe(false);
    expect(isPublicIpAddress("192.168.1.2")).toBe(false);
    expect(isPublicIpAddress("::1")).toBe(false);
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
  });
});
