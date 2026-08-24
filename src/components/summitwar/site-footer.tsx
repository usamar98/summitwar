import Link from "next/link";
import { Brand } from "@/components/summitwar/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/6 bg-black/15">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
        <div className="space-y-3">
          <Brand />
          <p>
            Sponsored placements. Transparent rules. A fresh summit every
            Monday.
          </p>
        </div>
        <nav
          className="flex flex-wrap gap-x-6 gap-y-2"
          aria-label="Footer navigation"
        >
          <Link href="/rules" className="hover:text-foreground">
            Rules
          </Link>
          <Link href="/stats" className="hover:text-foreground">
            Stats
          </Link>
          <Link href="/hall-of-fame" className="hover:text-foreground">
            Hall of Fame
          </Link>
          <Link href="/login" className="hover:text-foreground">
            Owner login
          </Link>
        </nav>
      </div>
    </footer>
  );
}
