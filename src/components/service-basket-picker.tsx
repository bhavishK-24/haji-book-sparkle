import { Minus, Plus, Video } from "lucide-react";
import { formatAed, resolveUnitPrice } from "@/data/pricing";
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
 * Two kinds of row, driven by the catalogue rather than by the slug on screen.
 * A service sold by the piece lists its sizes, each with its own price and
 * stepper. A service quoted from a video has no sizes to choose, only a count
 * of rooms, and says plainly that its price comes later.
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
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
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
  return (
    <div className="grid gap-4">
      {services.map((service) => {
        const variants = variantsFor(service.id);
        /* No sizes to choose means this one is quoted per room from a video. */
        const quoted = variants.length === 0;
        const chosenHere = basket
          .filter((l) => l.serviceId === service.id)
          .reduce((n, l) => n + l.quantity, 0);

        return (
          <div
            key={service.id}
            className={cn(
              "rounded-2xl border transition-colors duration-[var(--dur-base)]",
              chosenHere > 0 ? "border-primary bg-primary/[0.04]" : "border-border",
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 p-5">
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-semibold leading-snug tracking-tight">
                  {service.name}
                </h3>
                {service.shortDescription ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {service.shortDescription}
                  </p>
                ) : null}
              </div>

              {/*
                A room priced from a video gets its count here, beside the
                name, because there is no size list underneath to hang it on.
              */}
              {quoted ? (
                <Stepper
                  value={quantityOf(basket, service.id, null)}
                  onChange={(next) => onChange(setQuantity(basket, service.id, null, next))}
                  label={service.name}
                />
              ) : null}
            </div>

            {quoted ? (
              <p className="flex items-start gap-2 border-t border-border/70 px-5 py-3.5 text-xs leading-relaxed text-muted-foreground">
                <Video className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Priced from a short video you send us, so it is not included in the total below.
              </p>
            ) : (
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
                          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
                            {formatAed(unit.exclusive)} each + VAT
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
            )}
          </div>
        );
      })}
    </div>
  );
}
