import { Link } from "@tanstack/react-router";
import { ArrowRight, Camera, PhoneCall } from "lucide-react";
import { PriceTag } from "@/components/price-tag";
import { Button } from "@/components/ui/button";
import { formatAed, VAT_RATE } from "@/data/pricing";
import {
  basketCount,
  basketPrice,
  basketSummary,
  pricedLines,
  quotedBasketLines,
  type ServiceBasket,
} from "@/data/service-basket";
import type { Service } from "@/data/types";
import { COMPANY } from "@/lib/company";
import { WHATSAPP_MESSAGES, whatsappLink } from "@/lib/whatsapp";

/**
 * The price panel for a basket spanning several services.
 *
 * Separate from `BookingPricePanel` rather than another branch inside it: that
 * one answers "what does this service cost", which is a different question
 * from "what does this visit cost" and needs a different shape — a list of
 * lines, a total across them, and a caveat for anything in the basket we
 * cannot price online.
 *
 * Where the basket contains a room quoted from a video, the whole visit goes
 * to WhatsApp. A firm total for the sofas with the kitchen left open would be
 * a number the customer is not actually going to pay, and the coordinator has
 * to quote the room before the crew is scheduled anyway.
 */
export function BasketPricePanel({
  services,
  basket,
  bookHref,
}: {
  services: Service[];
  basket: ServiceBasket;
  /** Where "Book now" goes. Null while the basket cannot be booked. */
  bookHref: { to: string; params: Record<string, string>; search: Record<string, unknown> } | null;
}) {
  const count = basketCount(basket);

  /*
   * Nothing at all until something is in the basket. An empty prompt sitting
   * beside the list is a card that asks to be read and then says nothing —
   * the picker on the left already explains what to do, and a second panel
   * repeating it competes with the choice the customer is making.
   */
  if (count === 0) return null;

  const lines = pricedLines(basket, services);
  const quoted = quotedBasketLines(basket);
  const price = basketPrice(basket, services);
  const byId = new Map(services.map((s) => [s.id, s]));
  const tel = COMPANY.phone.replace(/\s/g, "");

  /* Anything quoted from a video makes the whole visit a quote. */
  const needsQuote = quoted.length > 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Your visit
      </p>
      <h3 className="mt-2 text-[1.0625rem] font-semibold leading-snug">
        {count} item{count === 1 ? "" : "s"} in one visit
      </h3>

      {lines.length > 0 ? (
        <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
          {lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt className="leading-snug text-muted-foreground">
                {line.quantity} × {line.label}
              </dt>
              <dd className="tabular-nums">{formatAed(line.lineTotal)}</dd>
            </div>
          ))}
          {price?.liftedToMinimum ? (
            <p className="text-xs leading-snug text-muted-foreground">
              Minimum booking value applied.
            </p>
          ) : null}
        </dl>
      ) : null}

      {/*
        Named rather than folded into a footnote: someone who added two
        bathrooms needs to see that they are on the list even though they
        carry no figure yet.
      */}
      {quoted.length > 0 ? (
        <ul className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
          {quoted.map((line) => (
            <li key={line.serviceId} className="flex items-baseline justify-between gap-4">
              <span className="leading-snug text-muted-foreground">
                {line.quantity} × {byId.get(line.serviceId)?.name ?? line.serviceId}
              </span>
              <span className="shrink-0 text-xs font-medium">On quote</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-5 border-t border-border pt-5">
        {needsQuote ? (
          <p className="text-lg font-semibold">Price on quote</p>
        ) : (
          <PriceTag price={price} size="large" />
        )}
      </div>

      {needsQuote ? (
        <p className="body-card mt-3 text-muted-foreground">
          Send us a short video of each room and we confirm one fixed price for the whole visit
          before we come.
        </p>
      ) : price ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          {VAT_RATE * 100}% VAT is added at checkout. Nothing is charged until we confirm the visit.
        </p>
      ) : null}

      <div className="mt-6 grid gap-2.5">
        {needsQuote ? (
          <>
            <Button asChild variant="accent" size="lg">
              <a
                href={whatsappLink(
                  WHATSAPP_MESSAGES.videoQuoteBasket(basketSummary(basket, services) ?? ""),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Camera className="size-4" aria-hidden />
                Get a quote on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`tel:${tel}`}>
                <PhoneCall className="size-4" aria-hidden />
                {COMPANY.phone}
              </a>
            </Button>
          </>
        ) : bookHref ? (
          <Button asChild size="lg" variant="accent" className="group">
            <Link to={bookHref.to} params={bookHref.params} search={bookHref.search}>
              Book now
              <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
