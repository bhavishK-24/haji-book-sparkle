import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/haji-ahli-logo.png.asset.json";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/book", label: "Book a slot" },
  { to: "/business", label: "For business" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container-page flex h-[4.5rem] items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo.url}
            alt="Haji Ahli Cleaning Services logo"
            width={120}
            height={120}
            className="h-11 w-auto"
          />
          <span className="leading-tight sm:hidden lg:block">
            <span className="block font-display text-sm font-bold tracking-tight">
              Haji Ahli
            </span>
            <span className="block text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
              Cleaning &amp; Maintenance
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={pathname === item.to ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === item.to && "text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            className="ml-3 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors duration-300 hover:bg-primary-deep"
          >
            <Phone className="size-4" />
            Call us
          </a>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-full border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="border-t border-border bg-background md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={pathname === item.to ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Phone className="size-4" />
              {COMPANY.phone}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}
