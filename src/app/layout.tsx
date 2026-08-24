import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteHeader } from "@/components/summitwar/site-header";
import { SiteFooter } from "@/components/summitwar/site-footer";
import { PresenceBeacon } from "@/components/summitwar/presence-beacon";
import { getPublicAppUrl } from "@/lib/app-url";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getPublicAppUrl(),
  title: {
    default: "SummitWar — The internet's highest startup position",
    template: "%s · SummitWar",
  },
  description:
    "A transparent sponsored-ranking game where startups climb a weekly virtual mountain. Every dollar adds 100 metres.",
  applicationName: "SummitWar",
  openGraph: {
    type: "website",
    siteName: "SummitWar",
    title: "Put your startup at the highest point on the internet.",
    description:
      "Climb the weekly startup mountain. Rankings are sponsored, transparent, and reset every Monday.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SummitWar",
    description: "Put your startup at the highest point on the internet.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#07101b",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "SummitWar",
  url: "https://summitwar.lol",
  description: "A transparent sponsored startup ranking game.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} dark`}
    >
      <body className="min-h-screen overflow-x-hidden antialiased">
        <TooltipProvider>
          <PresenceBeacon />
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </TooltipProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </body>
    </html>
  );
}
