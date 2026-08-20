import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Info, Minus, Plus } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { BookingSteps } from "@/components/booking-steps";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { availableAddOns, getService, suppressedBy } from "@/data";
import {
  addOnFromPrice,
  addOnTakesQuantity,
  addOnUnitPrice,
  addOnVariantsFor,
  addOnsSubtotal,
  encodeAddOns,
  MAX_PER_ADDON,
  type AddOnContext,
  type AddOnSelection,
} from "@/data/addon-selection";
import { bookableInCategory } from "@/data/booking-categories";
import { formatAed } from "@/data/pricing";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$category/extras")({
  validateSearch: z.object({
    service: z.string().catch(""),
    size: z.string().catch(""),
    furnishing: z.string().catch(""),
    /** Chosen item for unit-priced services, e.g. "3 Seater". */
    variant: z.string().catch(""),
    /** Room configurator answers. See data/configured/url.ts. */
    room: z.string().catch(""),
    /** Multi-item basket for per-piece services. See data/item-selection.ts. */
    items: z.string().catch(""),
  }),
  head: () => ({ meta: [{ title: "Add extras | Haji Ahli" }] }),
  component: ExtrasPage,
});

const categoryRoute = getRouteApi("/book/$category");

/** How the variant list should be introduced, by what the add-on is priced per. */
const VARIANT_LABEL: Record<string, string> = {
  mattresses: "Which size?",
  seats: "Which sofa?",
  squareMetres: "Which size carpet?",
};

function ExtrasPage() {
  const { category } = categoryRoute.useLoaderData();
  const { service: serviceId, size, furnishing, variant, room, items } = Route.useSearch();
  const navigate = useNavigate();

  const bookable = bookableInCategory(category);
  const service = (serviceId ? getService(serviceId) : undefined) ?? bookable[0];

  const [selection, setSelection] = useState<AddOnSelection>({});

  if (!service) return null;

  /*
   * The Intense upgrade is priced as the gap between Deep and Intense for this
   * customer's own property, so the property they chose two steps ago has to
   * travel with them to be able to show a figure here.
   */
  const ctx: AddOnContext = { size, furnishing };

  const selectedIds = Object.keys(selection);
  const offered = availableAddOns(service, selectedIds);
  const hiddenNotes = suppressedBy(selectedIds);
  const subtotal = addOnsSubtotal(offered, selection, ctx);

  /** Ticking an add-on takes the first variant the workbook lists, so it always has a price. */
  const toggle = (id: string) =>
    setSelection((prev) => {
      const next = { ...prev };
      if (next[id]) {
        delete next[id];
        return next;
      }
      next[id] = { variant: addOnVariantsFor(id)[0] ?? null, quantity: 1 };
      return next;
    });

  const setVariant = (id: string, value: string) =>
    setSelection((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, variant: value } };
    });

  const setQuantity = (id: string, quantity: number) =>
    setSelection((prev) => {
      const current = prev[id];
      if (!current) return prev;
      if (quantity < 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...current, quantity: Math.min(quantity, MAX_PER_ADDON) } };
    });

  const goOn = () =>
    navigate({
      to: "/book/$category/schedule",
      params: { category: category.slug },
      /*
       * Everything the customer has chosen so far rides along. Dropping a
       * field here silently un-prices the booking three steps later, which is
       * exactly what happened to `variant` and `room` — and to the quantities
       * on this page, which were collected and then thrown away.
       */
      search: {
        service: service.id,
        addons: encodeAddOns(selection),
        size,
        furnishing,
        variant,
        room,
        items,
      },
    });

  return (
    <>
      <div className="border-b border-border bg-background">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
          <BookingSteps
            current={2}
            categorySlug={category.slug}
            backTo={{ service: service.id }}
            withExtras
          />
          <Link
            to="/book/$category"
            params={{ category: category.slug }}
            className="link-underline inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Change package
          </Link>
        </div>
      </div>

      <section className="container-page section-y">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Optional</p>
          <h1 className="display-lg mt-4">Anything to add?</h1>
          <p className="lede mt-5">
            These extras attach to your{" "}
            <strong className="font-semibold text-foreground">{service.name}</strong> booking and
            are done in the same visit. All optional — skip if you don't need them.
          </p>
        </Reveal>

        <div className="mt-12 grid max-w-3xl gap-3">
          {offered.map((addOn, i) => {
            const choice = selection[addOn.id];
            const isOn = Boolean(choice);
            const variants = addOnVariantsFor(addOn.id);
            const takesQuantity = addOnTakesQuantity(addOn);

            /*
             * Before it is ticked, the cheapest variant with a "from". Once it
             * is ticked, the price of what they actually chose, times how many.
             */
            const unit = isOn
              ? addOnUnitPrice(addOn.id, choice?.variant ?? null, ctx)
              : addOnFromPrice(addOn.id, ctx);
            const lineTotal = unit && choice ? unit.exclusive * choice.quantity : null;

            return (
              <Reveal key={addOn.id} delay={Math.min(i, 5) * 50}>
                <div
                  className={cn(
                    "rounded-2xl border transition-colors duration-[var(--dur-base)]",
                    isOn ? "border-primary bg-primary/[0.04]" : "border-border",
                  )}
                >
                  <label className="flex cursor-pointer gap-4 p-5">
                    <input
                      type="checkbox"
                      checked={isOn}
                      onChange={() => toggle(addOn.id)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                        isOn ? "border-primary bg-primary" : "border-input",
                      )}
                    >
                      {isOn ? (
                        <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="font-display text-base font-semibold tracking-tight">
                          {addOn.name}
                        </span>
                        {/*
                          The price sits on the same line as the name, because
                          an extras list without figures is a list of things a
                          customer is afraid to tick.
                        */}
                        <span className="shrink-0 text-sm font-semibold tabular-nums">
                          {unit ? (
                            <>
                              {!isOn && variants.length > 1 ? (
                                <span className="font-normal text-muted-foreground">from </span>
                              ) : null}
                              {formatAed(unit.exclusive)}
                              <span className="font-normal text-muted-foreground"> + VAT</span>
                            </>
                          ) : (
                            <span className="font-medium text-muted-foreground">
                              Price on quote
                            </span>
                          )}
                        </span>
                      </span>
                      {addOn.description ? (
                        <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                          {addOn.description}
                        </span>
                      ) : null}
                    </span>
                  </label>

                  {isOn && variants.length > 0 ? (
                    <div className="border-t border-border/70 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {(addOn.quantityInput && VARIANT_LABEL[addOn.quantityInput]) ??
                          "Which one?"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {variants.map((v) => {
                          const vPrice = addOnUnitPrice(addOn.id, v, ctx);
                          const active = choice?.variant === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setVariant(addOn.id, v)}
                              aria-pressed={active}
                              className={cn(
                                "rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-[var(--dur-base)]",
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input hover:border-primary",
                              )}
                            >
                              {v}
                              {vPrice ? (
                                <span
                                  className={cn(
                                    "ml-2 tabular-nums",
                                    active ? "opacity-80" : "text-muted-foreground",
                                  )}
                                >
                                  {formatAed(vPrice.exclusive)}
                                </span>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {/* Per-unit add-ons need a count before we can price them. */}
                  {isOn && takesQuantity ? (
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/70 px-5 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        How many?
                      </p>
                      <div className="flex items-center gap-3">
                        {lineTotal !== null && (choice?.quantity ?? 0) > 1 ? (
                          <span className="text-sm font-semibold tabular-nums">
                            {formatAed(lineTotal)}
                            <span className="font-normal text-muted-foreground"> + VAT</span>
                          </span>
                        ) : null}
                        <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
                          <button
                            type="button"
                            onClick={() => setQuantity(addOn.id, (choice?.quantity ?? 1) - 1)}
                            aria-label={`One fewer ${addOn.name}`}
                            className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary"
                          >
                            <Minus className="size-3.5" aria-hidden />
                          </button>
                          <output className="min-w-7 text-center text-sm font-bold tabular-nums">
                            {choice?.quantity ?? 1}
                          </output>
                          <button
                            type="button"
                            onClick={() => setQuantity(addOn.id, (choice?.quantity ?? 1) + 1)}
                            disabled={(choice?.quantity ?? 1) >= MAX_PER_ADDON}
                            aria-label={`One more ${addOn.name}`}
                            className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <Plus className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* Explain disappearing options rather than letting them vanish silently. */}
        {hiddenNotes.length > 0 ? (
          <Reveal className="mt-6 flex max-w-3xl items-start gap-2.5 rounded-xl bg-secondary px-4 py-3.5">
            <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <p className="text-sm leading-relaxed text-muted-foreground">
              {hiddenNotes.map((n) => (
                <span key={n.by}>
                  {n.hides.map((h) => h.name).join(" and ")} {n.hides.length > 1 ? "are" : "is"}{" "}
                  already included in {n.by}, so {n.hides.length > 1 ? "they have" : "it has"} been
                  removed from the list.
                </span>
              ))}
            </p>
          </Reveal>
        ) : null}

        <div className="sticky bottom-0 z-30 mt-14 border-t border-border bg-background/90 py-5 backdrop-blur-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedIds.length === 0
                  ? "No extras selected"
                  : `${selectedIds.length} extra${selectedIds.length > 1 ? "s" : ""} selected`}
              </p>
              {/*
                A running total, so the customer knows what ticking one more
                box costs before they reach the last step and find out.
              */}
              {subtotal > 0 ? (
                <p className="mt-0.5 font-display text-lg font-bold tabular-nums">
                  {formatAed(subtotal)}
                  <span className="text-sm font-normal text-muted-foreground">
                    {" "}
                    + VAT in extras
                  </span>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-3">
              {selectedIds.length > 0 ? (
                <Button variant="outline" size="lg" onClick={() => setSelection({})}>
                  Clear
                </Button>
              ) : null}
              <Button size="lg" variant="accent" className="group" onClick={goOn}>
                {selectedIds.length === 0 ? "Skip and choose a date" : "Continue to date & time"}
                <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
