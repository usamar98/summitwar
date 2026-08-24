"use client";

import { useState } from "react";
import { NewListingForm } from "@/components/summitwar/climb-form";
import { SummitCard } from "@/components/summitwar/summit-card";
import type { Startup } from "@/lib/types";

export function MountainHeroPanel({ startup }: { startup: Startup | null }) {
  const [claiming, setClaiming] = useState(false);

  if (!startup && claiming) {
    return (
      <div aria-live="polite">
        <NewListingForm compact onCancel={() => setClaiming(false)} />
      </div>
    );
  }

  return (
    <SummitCard
      startup={startup}
      onClaim={startup ? undefined : () => setClaiming(true)}
    />
  );
}
