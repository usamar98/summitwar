import Link from "next/link";
import { Mountain } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2.5 font-semibold tracking-tight"
      aria-label="SummitWar home"
    >
      <span className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary shadow-[0_0_24px_-8px_var(--primary)] transition-transform group-hover:-translate-y-0.5">
        <Mountain className="size-4.5" aria-hidden="true" />
      </span>
      {compact ? null : (
        <span className="text-[15px]">
          SUMMIT<span className="text-primary">WAR</span>
        </span>
      )}
    </Link>
  );
}
