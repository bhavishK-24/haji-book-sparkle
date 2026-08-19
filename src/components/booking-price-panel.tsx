import { AlertCircle, ArrowRight, Camera, Mail, PhoneCall } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { PriceTag } from "@/components/price-tag";
import { Button } from "@/components/ui/button";
import type { ConfiguredOutcome } from "@/data/configured/types";
import { MIN_BOOKING_VALUE } from "@/data/configured/engine";
import { formatAed, VAT_RATE, type ResolvedPrice } from "@/data/pricing";
import type { Service } from "@/data";
import { COMPANY } from "@/lib/company";
import { WHATSAPP_MESSAGES, whatsappLink } from "@/lib/whatsapp";

/**
 * The price panel that sits beside the service list.
 *
 * One place on the page answers "what will this cost me?". Prices used to sit
 * under each service, which meant a customer comparing two packages had to
 * scroll between them and hold both figures in their head. Here the figure
 * updates in place as they choose, so comparing is a glance rather than a
 * memory exercise.
 *
 * Everything is shown excluding VAT with a "+ VAT" label; the inclusive total
 * takes over at checkout, where the customer is committing to an amount.
 */

/** Line-by-line breakdown for the room configurators. */
function ConfiguredLines({ outcome }: { outcome: Extract<ConfiguredOutcome, { kind: "priced" }> }) {
  return (
    <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
      {outcome.lines.map((line) => (
        <div key={line.label} className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">{line.label}</dt>
          <dd className="tabular-nums">{formatAed(line.amount)}</dd>
        </div>
      ))}
      {outcome.liftedToMinimum ? (
        <div className="flex items-baseline justify-between gap-4 text-muted-foreground">
          <dt>Minimum booking value</dt>
          <dd className="tabular-nums">{formatAed(MIN_BOOKING_VALUE)}</dd>
        </div>
      ) : null}
    </dl>
  );
}

export function BookingPricePanel({
  service,
  price,
  outcome,
  isExact,
  bookable,
  blockedReason,
  bookHref,
}: {
  service: Service | null;
  /** Resolved price for table-priced services. */
  price: ResolvedPrice | null;
  /** Configurator result, for Kitchen and Bathroom. */
  outcome: ConfiguredOutcome | null;
  /** False while showing an entry-level "from" price. */
  isExact: boolean;
  bookable: boolean;
  /** Why the customer cannot continue yet, if they cannot. */
  blockedReason: string | null;
  /** Where "Book now" goes. Null when it should not be offered. */
  bookHref: { to: string; params: Record<string, string>; search: Record<string, unknown> } | null;
}) {
  if (!service) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6">
        <p className="text-sm font-medium">Choose a service</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick one from the list and your price appears here.
        </p>
      </div>
    );
  }

  const tel = COMPANY.phone.replace(/\s/g, "");

  /* A configured room that needs a survey, or a service with no price at all. */
  const needsQuote = outcome?.kind === "quote" || (!bookable && !price);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Your price
      </p>
      <h3 className="mt-2 text-[1.0625rem] font-semibold leading-snug">{service.name}</h3>

      <div className="mt-5">
        {needsQuote ? (
          <p className="text-lg font-semibold">Price on quote</p>
        ) : outcome?.kind === "needs-input" ? (
          /*
           * Name the questions still outstanding. Saying only "answer the
           * questions" makes a panel that has already been half-filled look
           * frozen — the customer has answered something and nothing appeared
           * to happen, so the obvious conclusion is that it is broken.
           */
          <div>
            <p className="text-sm font-medium">Still to answer</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {outcome.unanswered.map((q) => (
                <li key={q} className="leading-snug">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        ) : outcome?.kind === "priced" ? (
          <PriceTag
            price={{
              exclusive: outcome.exclusive,
              vat: outcome.vat,
              inclusive: outcome.inclusive,
              currency: "AED",
              variantId: service.id,
              isTotal: true,
              unitLabel: null,
              liftedToMinimum: outcome.liftedToMinimum,
            }}
            size="large"
          />
        ) : (
          <PriceTag price={price} size="large" prefix={isExact ? undefined : "From"} />
        )}
      </div>

      {outcome?.kind === "priced" ? <ConfiguredLines outcome={outcome} /> : null}

      {outcome?.kind === "quote" ? (
        <p className="body-card mt-3 text-muted-foreground">{outcome.reason}</p>
      ) : null}

      {!needsQuote && (price || outcome?.kind === "priced") ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          {VAT_RATE * 100}% VAT is added at checkout. Nothing is charged until we confirm the visit.
        </p>
      ) : null}

      <div className="mt-6 grid gap-2.5">
        {needsQuote ? (
          <>
            <Button asChild variant="accent" size="lg">
              <a href={whatsappLink(WHATSAPP_MESSAGES.quote(service.name))}>
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
            <Button asChild variant="ghost" size="sm">
              <a
                href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(
                  `Quote request: ${service.name}`,
                )}`}
              >
                <Mail className="size-3.5" aria-hidden />
                Email us instead
              </a>
            </Button>
          </>
        ) : blockedReason ? (
          <>
            <Button size="lg" variant="accent" disabled aria-describedby="panel-blocked">
              Book now
              <ArrowRight />
            </Button>
            <p
              id="panel-blocked"
              className="flex items-start gap-2 text-sm font-medium text-accent"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {blockedReason}
            </p>
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
