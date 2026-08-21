import { ChevronDown, Minus, Plus, Video } from "lucide-react";
import { isVideoQuoted } from "@/data/configured/engine";
import { useState } from "react";
import { formatAed, priceFrom, resolveUnitPrice } from "@/data/pricing";
import {
  MAX_PER_LINE,
  quantityOf,
  setQuantity,
  variantsFor,
  type ServiceBasket,
} from "@/data/service-basket";
import type { Service } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * Builds a basket spanning several services in one category.
 *
 * The flow used to make the customer pick one service, so a kitchen and a
 * bathroom — or a sofa and a mattress — were two separate bookings for the
 * same address on the same day. Everything here goes into one visit.
 *
 * Sizes stay folded away until a service is opened. Soft furnishings alone
 * carry seventeen of them between sofas, carpets and mattresses, and listing
 * every one at once turned a three-way choice into a wall of steppers where
 * nothing looked more important than anything else. Closed, the page asks the
 * only question that matters first: which of these do you need? The sizes are
 * the second question, and they belong behind the answer to the first.
 *
 * Two kinds of card, driven by the catalogue rather than by the slug on
 * screen. A service sold by the piece opens onto its sizes. A service quoted
 * from a video has no sizes to choose, only a count of rooms, so it never
 * opens and says plainly that its price comes later.
 */

function Stepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  /** Screen-reader description of what is being counted. */
  label: string;
}) {
  const chosen = value > 0;
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card p-0.5">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value === 0}
        aria-label={`One fewer ${label}`}
        className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output
        className={cn(
          "min-w-7 text-center text-sm tabular-nums",
          chosen ? "font-bold" : "text-muted-foreground",
        )}
      >
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= MAX_PER_LINE}
        aria-label={`One more ${label}`}
        className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function ServiceBasketPicker({
  services,
  basket,
  onChange,
}: {
  /** The basketable services of one category, in catalogue order. */
  services: Service[];
  basket: ServiceBasket;
  onChange: (next: ServiceBasket) => void;
}) {
  /*
   * One open at a time. Closing the previous one is what keeps the list short
   * enough to read; anything already added stays in the basket and stays
   * visible in the summary panel beside it, so nothing is lost by folding a
   * service away.
   *
   * Nothing is open to begin with, unless the customer arrived on a link that
   * already carries a selection — in that case the service they had chosen is
   * the one they came back to change.
   */
  const [openId, setOpenId] = useState<string | null>(
    () => basket.find((l) => l.variant !== null)?.serviceId ?? null,
  );

  return (
    <div className="grid gap-3">
      {services.map((service) => {
        const variants = variantsFor(service.id);
        const quoted = isVideoQuoted(service.id);
        const open = openId === service.id;

        const lines = basket.filter((l) => l.serviceId === service.id);
        const chosenHere = lines.reduce((n, l) => n + l.quantity, 0);
        const subtotalHere = lines.reduce((sum, l) => {
          const unit = l.variant ? resolveUnitPrice(service.id, l.variant) : null;
          return sum + (unit ? unit.exclusive * l.quantity : 0);
        }, 0);

        const from = priceFrom(service.id);

        /* What the folded card says has been chosen, e.g. "2 × 3 Seater". */
        const chosenSummary =
          lines.length > 0
            ? lines.map((l) => `${l.quantity} × ${l.variant ?? service.name}`).join(", ")
            : null;

        const header = (
          <>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-base font-semibold leading-snug tracking-tight">
                {service.name}
              </h3>
              {/*
                The price sits directly under the name and is the boldest thing
                on the row. A customer scanning three services reads name then
                cost; a muted figure makes them hunt for it.
              */}
              <p className="mt-1 text-sm font-bold text-foreground">
                {from ? (
                  <>
                    From {formatAed(from.exclusive)}
                    <span className="font-medium text-muted-foreground"> + VAT</span>
                  </>
                ) : (
                  <span className="font-semibold text-muted-foreground">Price on quote</span>
                )}
              </p>
              {chosenSummary ? (
                <p className="mt-1.5 text-sm leading-snug text-primary">
                  <span className="font-semibold">{chosenSummary}</span>
                  {subtotalHere > 0 ? (
                    <span className="font-bold tabular-nums"> · {formatAed(subtotalHere)}</span>
                  ) : null}
                </p>
              ) : service.shortDescription ? (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {service.shortDescription}
                </p>
              ) : null}
            </div>

            {/*
              A room priced from a video gets its count here, beside the name,
              because there is no size list underneath to hang it on.
            */}
            {quoted ? (
              <Stepper
                value={quantityOf(basket, service.id, null)}
                onChange={(next) => onChange(setQuantity(basket, service.id, null, next))}
                label={service.name}
              />
            ) : (
              <span className="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
                {chosenHere > 0 ? "Change" : "Choose sizes"}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform duration-[var(--dur-base)]",
                    open && "rotate-180",
                  )}
                  aria-hidden
                />
              </span>
            )}
          </>
        );

        return (
          <div
            key={service.id}
            className={cn(
              "rounded-2xl border transition-colors duration-[var(--dur-base)]",
              chosenHere > 0 ? "border-primary bg-primary/[0.04]" : "border-border",
            )}
          >
            {quoted ? (
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 p-5">
                {header}
              </div>
            ) : (
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : service.id)}
                className="flex w-full flex-wrap items-start justify-between gap-x-4 gap-y-3 rounded-2xl p-5 text-left transition-colors duration-[var(--dur-base)] hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]"
              >
                {header}
              </button>
            )}

            {quoted ? (
              <p className="flex items-start gap-2 border-t border-border/70 px-5 py-3.5 text-xs leading-relaxed text-muted-foreground">
                <Video className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Priced from a short video you send us, so it is not included in the total below.
              </p>
            ) : open ? (
              <ul className="divide-y divide-border border-t border-border/70">
                {variants.map((variant) => {
                  const qty = quantityOf(basket, service.id, variant);
                  const unit = resolveUnitPrice(service.id, variant);
                  return (
                    <li key={variant} className="flex items-center justify-between gap-4 px-5 py-3">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-[0.9375rem] leading-snug",
                            qty > 0 && "font-semibold",
                          )}
                        >
                          {variant}
                        </p>
                        {unit ? (
                          <p className="mt-0.5 text-xs tabular-nums">
                            <span className="font-bold text-foreground">
                              {formatAed(unit.exclusive)}
                            </span>
                            <span className="text-muted-foreground"> each + VAT</span>
                          </p>
                        ) : null}
                      </div>
                      <Stepper
                        value={qty}
                        onChange={(next) =>
                          onChange(setQuantity(basket, service.id, variant, next))
                        }
                        label={`${variant} ${service.name}`}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
