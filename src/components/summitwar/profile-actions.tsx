"use client";

import { useEffect, useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    if (!/^[0-9a-f-]{36}$/i.test(listingId)) return;
    void fetch("/api/analytics/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId }),
      keepalive: true,
    });
  }, [listingId]);
  return null;
}

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const absolute = new URL(url, window.location.origin).toString();
    if (navigator.share)
      await navigator.share({
        title,
        text: `${title} is climbing SummitWar.`,
        url: absolute,
      });
    else {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }
  return (
    <Button type="button" variant="outline" onClick={share}>
      {copied ? <Check /> : <Share2 />}
      {copied ? "Copied" : "Share"}
    </Button>
  );
}
