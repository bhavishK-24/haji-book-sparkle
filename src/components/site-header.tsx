import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowRight, Clock, Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import logo128 from "@/assets/brand/haji-ahli-logo-128.png";
import logo256 from "@/assets/brand/haji-ahli-logo-256.png";
import { Button } from "@/components/ui/button";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * "Book" is deliberately absent — it is the header CTA rather than a nav item,
 * so the primary conversion path is never just one link among four.
 */
const NAV = [
  { to: "/", label: "Home" },
  { to: "/services", label: "Services" },
  { to: "/business", label: "For business" },
] as const;

const MOBILE_MENU_ID = "site-mobile-nav";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tel = COMPANY.phone.replace(/\s/g, "");

  // Close the mobile panel whenever navigation happens.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    // 24px rather than 8px so the utility bar does not flicker on tiny scrolls.
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the panel is open: trap scroll on the body and allow Escape to close.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl",
        "transition-[border-color,box-shadow,height] duration-[var(--dur-base)] ease-out",
        scrolled
          ? "border-border shadow-[0_1px_28px_oklch(0.26_0.055_150.6_/_0.08)]"
          : "border-border/60",
      )}
    >
      <div className="container-page flex h-[4.75rem] items-center justify-between gap-4">
        <Link
          to="/"
          className="group flex items-center gap-3 rounded-lg"
          aria-label={`${COMPANY.shortName} — home`}
        >
          {/* Logo is 1159x900 after trimming; keep that ratio to avoid CLS. */}
          <img
            src={logo128}
            srcSet={`${logo128} 128w, ${logo256} 256w`}
            sizes="76px"
            alt=""
            width={1159}
            height={900}
            decoding="async"
            className="h-11 w-auto transition-transform duration-[var(--dur-base)] ease-out group-hover:scale-[1.03] sm:h-[3.25rem]"
          />
          <span className="hidden leading-tight sm:block">
            <span className="block font-display text-[0.95rem] font-bold tracking-tight">
              Haji Ahli
            </span>
            <span className="block text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
              Cleaning &amp; Maintenance
            </span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
          {/*
              Nav sits in its own inset group so it reads as one control rather
              than three loose links, and the active item is a filled pill —
              legible at a glance in a way a colour change alone is not.
            */}
          <div className="flex items-center gap-1 rounded-full bg-secondary/60 p-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{
                  "aria-current": "page",
                  className: "bg-card text-foreground shadow-soft",
                }}
                inactiveProps={{ className: "text-muted-foreground hover:text-foreground" }}
                className="rounded-full px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow] duration-[var(--dur-base)]"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/*
              Phone sits in the bar itself. It used to live in a strip above,
              which read as a second header rather than part of this one.
            */}
          <a
            href={`tel:${tel}`}
            className="ml-2 flex items-center gap-2.5 rounded-full px-3 py-2 transition-colors duration-[var(--dur-base)] hover:bg-secondary lg:ml-3"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <Phone className="size-4" strokeWidth={2} aria-hidden />
            </span>
            <span className="hidden leading-tight lg:block">
              <span className="block text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">
                Call us
              </span>
              <span className="block text-[0.8125rem] font-semibold tracking-tight">
                {COMPANY.phone}
              </span>
            </span>
          </a>

          <Button asChild variant="accent" size="default" className="group ml-1.5">
            <Link to="/book">
              Book a service
              <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Button asChild variant="accent" size="sm">
            <Link to="/book">Book</Link>
          </Button>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors duration-[var(--dur-base)] hover:bg-secondary"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      <div
        id={MOBILE_MENU_ID}
        hidden={!open}
        className="animate-in fade-in slide-in-from-top-2 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-border bg-background duration-[var(--dur-base)] md:hidden"
      >
        <nav aria-label="Mobile" className="container-page flex flex-col py-4">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{
                "aria-current": "page",
                className: "bg-secondary text-foreground",
              }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="flex min-h-12 items-center rounded-xl px-4 text-base font-medium transition-colors hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}

          <a
            href={`tel:${tel}`}
            className="mt-3 flex min-h-12 items-center gap-2.5 rounded-xl border border-border px-4 text-base font-semibold"
          >
            <Phone className="size-4 text-primary" aria-hidden />
            <span className="sr-only">Call </span>
            {COMPANY.phone}
          </a>
          <p className="flex items-center gap-2 px-4 pb-1 pt-4 text-xs text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            {COMPANY.hours}
          </p>
        </nav>
      </div>
    </header>
  );
}
