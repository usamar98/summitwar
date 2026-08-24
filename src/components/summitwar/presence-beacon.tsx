"use client";

import { useEffect } from "react";

export function PresenceBeacon() {
  useEffect(() => {
    const heartbeat = () => {
      if (document.visibilityState === "visible")
        void fetch("/api/analytics/presence", {
          method: "POST",
          keepalive: true,
        });
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 45_000);
    document.addEventListener("visibilitychange", heartbeat);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", heartbeat);
    };
  }, []);
  return null;
}
