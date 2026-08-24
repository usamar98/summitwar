"use client";

import { useEffect, useState } from "react";

function parts(end: string) {
  const remaining = Math.max(0, new Date(end).getTime() - Date.now());
  const seconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export function Countdown({
  end,
  compact = false,
}: {
  end: string;
  compact?: boolean;
}) {
  const [time, setTime] = useState(() => parts(end));
  useEffect(() => {
    const timer = window.setInterval(() => setTime(parts(end)), 1000);
    return () => window.clearInterval(timer);
  }, [end]);
  const value = `${time.days}d ${String(time.hours).padStart(2, "0")}h ${String(time.minutes).padStart(2, "0")}m ${String(time.seconds).padStart(2, "0")}s`;
  return (
    <span
      className={
        compact
          ? "font-mono text-xs"
          : "font-mono text-lg font-semibold tracking-tight text-foreground"
      }
      suppressHydrationWarning
    >
      {value}
    </span>
  );
}
