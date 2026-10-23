import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "Services", href: "#services" },
  { label: "How it works", href: "#how-it-works" },
];

const navLinkClass = "whitespace-nowrap text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

export default function LogoHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur safe-area-top">
      <div className="mx-auto max-w-[1320px] px-5 md:px-10">
        <div className="flex h-16 items-center justify-between gap-3 md:h-[76px]">
          <Link to="/" aria-label="Neighbourhood Labour Connect home" className="flex min-w-0 shrink items-center gap-3">
            <img src="/icon.svg" alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
            <span className="truncate font-display text-sm font-bold tracking-tight text-foreground sm:text-base">
              Neighbourhood Labour Connect
            </span>
          </Link>

          <nav aria-label="Main menu" className="hidden items-center gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className={navLinkClass}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Button asChild variant="ghost" className="h-10 rounded-xl px-3 text-sm font-semibold">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="h-10 rounded-xl px-4 text-sm font-semibold">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>

        <nav aria-label="Page sections" className="flex gap-7 overflow-x-auto pb-3 no-scrollbar lg:hidden">
          {NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href} className={navLinkClass}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
