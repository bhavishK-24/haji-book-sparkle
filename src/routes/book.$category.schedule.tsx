import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { z } from "zod";
import { BookingSteps } from "@/components/booking-steps";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { addOnsForService, getService, isNextDayEligible } from "@/data";
import { bookableInCategory } from "@/data/booking-categories";
import { ARRIVAL_PREFERENCES, ARRIVAL_TIMES } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$category/schedule")({
  validateSearch: z.object({
    service: z.string().catch(""),
    addons: z.string().catch(""),
    size: z.string().catch(""),
    furnishing: z.string().catch(""),
    /** Chosen item for unit-priced services, e.g. "3 Seater". */
    variant: z.string().catch(""),
    /** Room configurator answers. See data/configured/url.ts. */
    room: z.string().catch(""),
    /** Multi-item basket for per-piece services. See data/item-selection.ts. */
    items: z.string().catch(""),
  }),
  head: () => ({ meta: [{ title: "Choose a date | Haji Ahli" }] }),
  component: SchedulePage,
});

const categoryRoute = getRouteApi("/book/$category");

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function SchedulePage() {
  const { category } = categoryRoute.useLoaderData();
  const { service: serviceId, addons, size, furnishing, variant, room, items } = Route.useSearch();
  const navigate = useNavigate();

  const bookable = bookableInCategory(category);
  // Fall back to the first bookable option if the URL carries an unknown id.
  const service = (serviceId ? getService(serviceId) : undefined) ?? bookable[0] ?? undefined;
  /*
   * Only used to decide whether the extras step counts towards the step
   * numbering. Split on both separators: the parameter now carries variants
   * and quantities joined by ";", and used to be a bare comma-separated list.
   */
  const addOnIds = addons ? addons.split(/[;,]/).filter(Boolean) : [];
  const hasExtras = service ? addOnsForService(service).length > 0 : false;

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [arrival, setArrival] = useState("");
  const [flexible, setFlexible] = useState(false);

  const earliest = useMemo(() => {
    const d = startOfToday();
    d.setDate(d.getDate() + (service && isNextDayEligible(service) ? 1 : 2));
    return d;
  }, [service]);

  if (!service) return null;

  const canContinue = Boolean(date && arrival);

  return (
    <>
      <div className="border-b border-border bg-background">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
          <BookingSteps
            current={addOnIds.length || hasExtras ? 3 : 2}
            categorySlug={category.slug}
            backTo={{ service: service.id }}
            withExtras={hasExtras}
          />
          <Link
            to="/book/$category"
            params={{ category: category.slug }}
            className="link-underline inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Change service
          </Link>
        </div>
      </div>

      <section className="container-page section-y">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">Step 2</p>
          <h1 className="display-lg mt-4">When should we come?</h1>
          <p className="lede mt-5">
            You're booking <strong className="font-semibold text-foreground">{service.name}</strong>
            .
            {isNextDayEligible(service)
              ? " Next-day booking is available."
              : " This service is scheduled with at least two days' notice."}
          </p>
        </Reveal>

        <div className="mt-12 grid gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16">
          <Reveal>
            <h2 className="display-sm">Pick a date</h2>
            <div className="mt-5 inline-block rounded-2xl border border-border bg-card p-3 shadow-soft">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={{ before: earliest }}
                defaultMonth={earliest}
              />
            </div>
          </Reveal>

          <Reveal delay={100}>
            <h2 className="display-sm">Preferred arrival time</h2>
            <p className="body-card mt-3 max-w-lg text-muted-foreground">
              Choose when you'd like the crew to arrive. How long the visit takes depends on the
              service and your property — we confirm that in your booking confirmation.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {ARRIVAL_PREFERENCES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={flexible && arrival === p.label}
                  onClick={() => {
                    setFlexible(true);
                    setArrival(p.label);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-base)]",
                    flexible && arrival === p.label
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground/25 hover:bg-secondary",
                  )}
                >
                  {p.label}
                  <span className="ml-2 text-xs opacity-70">{p.detail}</span>
                </button>
              ))}
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Or a specific time
            </p>
            <div className="mt-3 grid max-w-lg grid-cols-3 gap-2 sm:grid-cols-5">
              {ARRIVAL_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={!flexible && arrival === t}
                  onClick={() => {
                    setFlexible(false);
                    setArrival(t);
                  }}
                  className={cn(
                    "rounded-lg border py-2.5 text-sm font-semibold tabular-nums transition-colors duration-[var(--dur-base)]",
                    !flexible && arrival === t
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground/25 hover:bg-secondary",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Sticky continue bar: the choice is made above, the action stays put. */}
        <div className="sticky bottom-0 z-30 mt-14 border-t border-border bg-background/90 py-5 backdrop-blur-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {date ? format(date, "EEEE d MMMM yyyy") : "No date selected"}
              {arrival ? ` · ${arrival}` : ""}
            </p>
            <Button
              size="lg"
              variant="accent"
              className="group"
              disabled={!canContinue}
              onClick={() =>
                navigate({
                  to: "/book/$category/details",
                  params: { category: category.slug },
                  /*
                   * The whole selection travels to checkout. This step used to
                   * forward only the service, date and time, so every booking
                   * arrived at the last page with nothing to price and showed
                   * "price on quote" however carefully the customer had chosen.
                   */
                  search: {
                    service: service.id,
                    addons,
                    size,
                    furnishing,
                    variant,
                    room,
                    items,
                    date: date ? format(date, "yyyy-MM-dd") : "",
                    time: arrival,
                  },
                })
              }
            >
              Continue to your details
              <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
