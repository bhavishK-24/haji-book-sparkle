import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatAed, type ResolvedPrice } from "@/data/pricing";
import { cn } from "@/lib/utils";

/**
 * The price and the primary action, pinned to the bottom of a phone.
 *
 * On a laptop the price panel is a sticky sidebar, so it is on screen the
 * whole time a customer is choosing. On a phone the same panel is a block at
 * the very bottom of a single column — below the size list, the scope lists
 * and the materials note. Someone who picked a property and a package had to
 * scroll past everything they had already read to find out what it cost, and
 * then scroll back up to change their mind.
 *
 * This is the pattern every modern booking flow settled on for the same
 * reason: the number and the button follow the customer instead of waiting
 * for them. It renders only below `lg` — the desktop layout already solves
 * this with the sticky sidebar, and two price panels on one screen would be
 * two sources of truth.
 *
 * Deliberately not shown until there is a real figure. A bar that says
 * "select a service" occupies the bottom of every phone screen to deliver no
 * information, and costs a line of content on the smallest viewports.
 */
export function MobileBookingBar({
  price,
  isExact,
  summary,
  blockedReason,
  bookHref,
}: {
  price: ResolvedPrice | null;
  /** False while the figure is still an entry-level "from". */
  isExact: boolean;
  /** What the price is for, e.g. "Deep Cleaning · 2 Bed Apartment". */
  summary: string | null;
  /** Why the customer cannot continue yet, if they cannot. */
  blockedReason: string | null;
  bookHref: { to: string; params: Record<string, string>; search: Record<string, unknown> } | null;
}) {
  const visible = price !== null;

  /*
   * Tell the page a bar is on screen, so the floating WhatsApp button can get
   * out of its way. Both are fixed to the bottom at z-40, and without this the
   * button sat on top of "Book now" — see the rule in `styles.css`.
   */
  useEffect(() => {
    if (!visible) return;
    document.body.dataset["bookingBar"] = "true";
    return () => {
      delete document.body.dataset["bookingBar"];
    };
  }, [visible]);

  if (!price) return null;

  return (
    <>
      {/*
        A spacer in normal flow, because the bar itself is fixed. Without it
        the bar sits on top of the last ~5rem of the page — which is the
        footer, so the contact details and the legal links end up underneath
        it on every phone.
      */}
      <div aria-hidden className="h-24 lg:hidden" />

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg lg:hidden",
          /* Clears the iOS home indicator without padding the bar on Android. */
          "pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3",
        )}
      >
        <div className="container-page flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-baseline gap-1.5">
              {!isExact ? (
                <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  From
                </span>
              ) : null}
              <span className="font-display text-xl font-bold tabular-nums tracking-tight">
                {formatAed(price.exclusive)}
              </span>
              <span className="text-xs font-medium text-muted-foreground">+ VAT</span>
            </p>
            {/*
            One line, truncated. It exists so the figure is attributable —
            a price with nothing attached to it is the thing customers
            distrust most in a booking flow.
          */}
            {summary ? (
              <p className="truncate text-xs leading-snug text-muted-foreground">{summary}</p>
            ) : null}
          </div>

          {blockedReason ? (
            <p className="shrink-0 text-right text-xs font-medium leading-snug text-accent">
              {blockedReason}
            </p>
          ) : bookHref ? (
            <Button asChild size="lg" variant="accent" className="shrink-0">
              <Link to={bookHref.to} params={bookHref.params} search={bookHref.search}>
                Book now
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
