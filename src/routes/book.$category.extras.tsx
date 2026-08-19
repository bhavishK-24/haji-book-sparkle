import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Info } from "lucide-react";
import { useState } from "react";
import { z } from "zod";
import { BookingSteps } from "@/components/booking-steps";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { availableAddOns, getService, suppressedBy } from "@/data";
import { bookableInCategory } from "@/data/booking-categories";
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
  }),
  head: () => ({ meta: [{ title: "Add extras | Haji Ahli" }] }),
  component: ExtrasPage,
});

const categoryRoute = getRouteApi("/book/$category");

/** Human label for the quantity a per-unit add-on needs. */
const QUANTITY_LABEL: Record<string, string> = {
  mattresses: "How many mattresses?",
  seats: "How many seats?",
  squareMetres: "Approximate area (m²)",
  bathrooms: "How many bathrooms?",
  balconies: "How many balconies?",
  panels: "How many curtain panels?",
};

function ExtrasPage() {
  const { category } = categoryRoute.useLoaderData();
  const { service: serviceId, size, furnishing, variant, room } = Route.useSearch();
  const navigate = useNavigate();

  const bookable = bookableInCategory(category);
  const service = (serviceId ? getService(serviceId) : undefined) ?? bookable[0];

  const [selected, setSelected] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  if (!service) return null;

  const offered = availableAddOns(service, selected);
  const hiddenNotes = suppressedBy(selected);

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const goOn = () =>
    navigate({
      to: "/book/$category/schedule",
      params: { category: category.slug },
      /*
       * Everything the customer has chosen so far rides along. Dropping a
       * field here silently un-prices the booking three steps later, which is
       * exactly what happened to `variant` and `room`.
       */
      search: { service: service.id, addons: selected.join(","), size, furnishing, variant, room },
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
            const isOn = selected.includes(addOn.id);
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
                      <span className="block font-display text-base font-semibold tracking-tight">
                        {addOn.name}
                      </span>
                      {addOn.description ? (
                        <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                          {addOn.description}
                        </span>
                      ) : null}
                    </span>
                  </label>

                  {/* Per-unit add-ons need a count before we can price or time them. */}
                  {isOn && addOn.quantityInput ? (
                    <div className="border-t border-border/70 px-5 py-4">
                      <label
                        className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                        htmlFor={`qty-${addOn.id}`}
                      >
                        {QUANTITY_LABEL[addOn.quantityInput] ?? "Quantity"}
                      </label>
                      <input
                        id={`qty-${addOn.id}`}
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={quantities[addOn.id] ?? ""}
                        onChange={(e) =>
                          setQuantities((q) => ({ ...q, [addOn.id]: Number(e.target.value) }))
                        }
                        className="mt-2 w-32 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
                      />
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
            <p className="text-sm text-muted-foreground">
              {selected.length === 0
                ? "No extras selected"
                : `${selected.length} extra${selected.length > 1 ? "s" : ""} selected`}
            </p>
            <div className="flex flex-wrap gap-3">
              {selected.length > 0 ? (
                <Button variant="outline" size="lg" onClick={() => setSelected([])}>
                  Clear
                </Button>
              ) : null}
              <Button size="lg" variant="accent" className="group" onClick={goOn}>
                {selected.length === 0 ? "Skip and choose a date" : "Continue to date & time"}
                <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
