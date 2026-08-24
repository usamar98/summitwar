import Image from "next/image";
import { cn } from "@/lib/utils";

export function StartupMark({
  name,
  logoUrl,
  className,
}: {
  name: string;
  logoUrl: string | null;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn(
        "relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 text-xs font-bold text-white shadow-lg",
        className,
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes="64px"
          className="object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
