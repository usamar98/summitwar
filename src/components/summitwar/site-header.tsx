import Link from "next/link";
import { Menu } from "lucide-react";
import { Brand } from "@/components/summitwar/brand";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  ["Leaderboard", "/#mountain"],
  ["Categories", "/categories"],
  ["Activity", "/activity"],
  ["Hall of Fame", "/hall-of-fame"],
  ["Live Stats", "/stats"],
  ["Rules", "/rules"],
  ["About", "/about"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-background/82 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <Brand />
        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Primary navigation"
        >
          {links.map(([label, href]) => (
            <Button key={href} asChild variant="ghost">
              <Link href={href}>{label}</Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            asChild
            className="h-9 bg-primary px-4 text-primary-foreground shadow-[0_0_28px_-10px_var(--primary)] hover:bg-primary/90"
          >
            <Link href="/start">Submit project</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card p-6">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-8 grid gap-2" aria-label="Mobile navigation">
                {links.map(([label, href]) => (
                  <SheetClose key={href} asChild>
                    <Button
                      asChild
                      variant="ghost"
                      className="h-11 justify-start"
                    >
                      <Link href={href}>{label}</Link>
                    </Button>
                  </SheetClose>
                ))}
                <SheetClose asChild>
                  <Button asChild className="mt-3">
                    <Link href="/dashboard">Owner dashboard</Link>
                  </Button>
                </SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
