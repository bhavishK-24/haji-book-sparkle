import { useMutation } from "@tanstack/react-query";
import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { format, parseISO } from "date-fns";
import { ArrowLeft, CalendarCheck, Info, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { BookingSteps } from "@/components/booking-steps";
import { PriceBreakdown } from "@/components/price-breakdown";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { addOnsForService, getAddOn, getService } from "@/data";
import { isConfigured, priceBathroom, priceKitchen } from "@/data/configured/engine";
import { roomSummaryFor } from "@/data/configured/summary";
import { decodeBathroomSelection, decodeKitchenSelection } from "@/data/configured/url";
import {
  applyMinimumBookingValue,
  resolveItemsPrice,
  resolvePropertyPrice,
  resolveUnitPrice,
} from "@/data/pricing";
import { decodeItems, itemLines, itemsSummary } from "@/data/item-selection";
import { bookableInCategory } from "@/data/booking-categories";
import { track } from "@/lib/analytics";
import { createBooking } from "@/lib/bookings.functions";
import { COMPANY, EMIRATES, PROPERTY_TYPES } from "@/lib/company";
import { WHATSAPP_MESSAGES, whatsappLink } from "@/lib/whatsapp";

/** How quickly the office commits to calling back. */
const CONFIRMATION_WINDOW = "2 working hours";

export const Route = createFileRoute("/book/$category/details")({
  validateSearch: z.object({
    service: z.string().catch(""),
    date: z.string().catch(""),
    time: z.string().catch(""),
    addons: z.string().catch(""),
    size: z.string().catch(""),
    furnishing: z.string().catch(""),
    /** Room configurator answers, for Kitchen and Bathroom. See configured/url.ts. */
    room: z.string().catch(""),
    /** Chosen item for band-priced services, e.g. "3 Bedroom Villa". */
    variant: z.string().catch(""),
    /** Multi-item basket for per-piece services. See data/item-selection.ts. */
    items: z.string().catch(""),
  }),
  head: () => ({ meta: [{ title: "Your details | Haji Ahli" }] }),
  component: DetailsPage,
});

const categoryRoute = getRouteApi("/book/$category");

const field =
  "w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors duration-[var(--dur-fast)] focus:border-primary";
const label = "mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground";

function DetailsPage() {
  const { category } = categoryRoute.useLoaderData();
  const {
    service: serviceId,
    date,
    time,
    addons,
    size,
    furnishing,
    room,
    variant,
    items: itemsRaw,
  } = Route.useSearch();
  const submit = useServerFn(createBooking);
  const [done, setDone] = useState(false);
  const [reference, setReference] = useState<string | null>(null);

  const bookable = bookableInCategory(category);
  const service = (serviceId ? getService(serviceId) : undefined) ?? bookable[0];
  const selectedAddOns = (addons ? addons.split(",").filter(Boolean) : [])
    .map(getAddOn)
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  const hasExtras = service ? addOnsForService(service).length > 0 : false;
  /*
   * Base package price only. Add-ons are unpriced, so the total is confirmed
   * on the call rather than shown as if it were final.
   *
   * Kitchen and Bathroom are re-priced here from the answers in the URL rather
   * than trusting a figure passed along with them — the price the customer is
   * asked to confirm is always computed from their actual selections.
   */
  const roomOutcome =
    service && isConfigured(service.id)
      ? service.id === "SVC-104"
        ? priceKitchen(decodeKitchenSelection(room))
        : priceBathroom(decodeBathroomSelection(room))
      : null;

  /* What the customer told us about the room, for the crew's job sheet. */
  const roomSummary =
    service && isConfigured(service.id)
      ? roomSummaryFor(service.id, decodeKitchenSelection(room), decodeBathroomSelection(room))
      : null;

  /*
   * The basket for per-piece services, re-read from the URL and validated
   * against the catalogue rather than trusted. A hand-edited link can only ever
   * produce fewer items, never a price for something we do not sell.
   */
  const basket = service ? decodeItems(itemsRaw, service.id) : {};
  const basketSummary = service ? itemsSummary(service.id, basket) : null;
  const basketLines = service ? itemLines(service.id, basket) : [];

  const price =
    roomOutcome?.kind === "priced"
      ? {
          exclusive: roomOutcome.exclusive,
          vat: roomOutcome.vat,
          inclusive: roomOutcome.inclusive,
          currency: "AED",
          variantId: service?.id ?? "",
          isTotal: true,
          unitLabel: null,
          liftedToMinimum: roomOutcome.liftedToMinimum,
        }
      : !service
        ? null
        : /*
           * Three ways a service can be priced, and the checkout has to try all
           * of them. Only the property path was wired before, so a sofa or a
           * water tank reached this page with a real price on the sheet and
           * still read "price on quote".
           */
          applyMinimumBookingValue(
            (Object.keys(basket).length > 0 ? resolveItemsPrice(service.id, basket) : null) ??
              (variant ? resolveUnitPrice(service.id, variant) : null) ??
              (size ? resolvePropertyPrice(service.id, size, furnishing ?? null) : null),
            service.id,
          );

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => submit({ data: payload as never }),
    onSuccess: (result: { reference?: string }) => {
      setDone(true);
      setReference(result?.reference ?? null);
      track("booking_submitted", { service: service?.name, time_slot: time });
    },
    onError: (error: Error) => toast.error(error.message || "Something went wrong."),
  });

  if (!service) return null;

  /** Guard: someone landed here without completing step 2. */
  const incomplete = !date || !time;

  if (done) {
    const prettyDate = date ? format(parseISO(date), "EEEE d MMMM yyyy") : "";
    return (
      <section className="container-page section-y">
        <Reveal className="mx-auto max-w-xl">
          <div className="text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <CalendarCheck className="size-7" strokeWidth={1.5} />
            </div>
            <h1 className="display-lg mt-7">Request received</h1>
            <p className="lede mt-4">
              A coordinator will call you within {CONFIRMATION_WINDOW} to confirm scope, timing and
              price.
            </p>
          </div>

          {/*
            A reference the customer can quote, plus a written summary. Without
            these the confirmation is a dead end — nothing to save, nothing to
            check against, and no way to follow up.
          */}
          <div className="mt-9 rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Your reference
                </p>
                <p className="mt-1.5 font-mono text-xl font-bold tracking-tight">
                  {reference ?? "—"}
                </p>
              </div>
              <span className="rounded-full border border-primary/30 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-primary">
                Awaiting confirmation
              </span>
            </div>

            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Service</dt>
                <dd className="mt-1 font-medium">{service.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="mt-1 font-medium">{prettyDate || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Arrival</dt>
                <dd className="mt-1 font-medium">{time || "—"}</dd>
              </div>
              {selectedAddOns.length > 0 ? (
                <div>
                  <dt className="text-muted-foreground">Extras</dt>
                  <dd className="mt-1 font-medium">
                    {selectedAddOns.map((a) => a.name).join(", ")}
                  </dd>
                </div>
              ) : null}
            </dl>

            {/*
              Itemised at the point of commitment. Browsing shows one
              VAT-inclusive figure; here the customer sees the arithmetic.
            */}
            <PriceBreakdown
              className="mt-5"
              price={price}
              lines={basketLines}
              label={selectedAddOns.length > 0 ? "Package" : "Service"}
              note={
                selectedAddOns.length > 0
                  ? "Extras are priced separately and confirmed on the call, so this covers the package only."
                  : null
              }
            />
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="lg">
              <a
                href={whatsappLink(
                  WHATSAPP_MESSAGES.booking(reference ?? "", service.name, prettyDate),
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                Continue on WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>Call {COMPANY.phone}</a>
            </Button>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Save your reference — quote it when you call or message us.
          </p>
        </Reveal>
      </section>
    );
  }

  return (
    <>
      <div className="border-b border-border bg-background">
        <div className="container-page flex flex-wrap items-center justify-between gap-4 py-6">
          <BookingSteps
            current={hasExtras ? 4 : 3}
            categorySlug={category.slug}
            backTo={{ service: service.id }}
            withExtras={hasExtras}
          />
          <Link
            to="/book/$category/schedule"
            params={{ category: category.slug }}
            search={{ service: service.id, addons }}
            className="link-underline inline-flex items-center gap-2 text-sm font-medium text-muted-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Change date
          </Link>
        </div>
      </div>

      <section className="container-page section-y">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
          <div>
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Step 3</p>
              <h1 className="display-lg mt-4">Where should we come?</h1>
              <p className="lede mt-5">
                Last step. We confirm every booking by phone before dispatching a crew — no payment
                is taken online.
              </p>
            </Reveal>

            {incomplete ? (
              <Reveal className="mt-8 rounded-2xl border border-border bg-secondary p-6">
                <p className="body-card">
                  Your date and time are missing.{" "}
                  <Link
                    to="/book/$category/schedule"
                    params={{ category: category.slug }}
                    search={{ service: service.id }}
                    className="font-semibold text-primary underline underline-offset-4"
                  >
                    Go back and choose them
                  </Link>
                  .
                </p>
              </Reveal>
            ) : null}

            <Reveal delay={80}>
              <form
                className="mt-10 grid max-w-xl gap-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (incomplete) {
                    toast.error("Please choose a date and time first.");
                    return;
                  }
                  const form = new FormData(event.currentTarget);
                  mutation.mutate({
                    customer_name: String(form.get("customer_name") ?? ""),
                    phone: String(form.get("phone") ?? ""),
                    email: String(form.get("email") ?? ""),
                    service_id: service.id,
                    service: service.name,
                    property_type: String(form.get("property_type") ?? ""),
                    emirate: String(form.get("emirate") ?? ""),
                    address: String(form.get("address") ?? ""),
                    // VAT-exclusive, matching how the workbook records it.
                    price_amount: price ? price.exclusive : null,
                    property_size: size,
                    furnishing,
                    add_ons: selectedAddOns.map((a) => ({
                      id: a.id,
                      name: a.name,
                      quantity: null,
                    })),
                    booking_date: date,
                    time_slot: time,
                    /*
                     * Extras ride along in `notes`. The booking schema has no
                     * add-on column yet and strips unknown keys silently, so
                     * sending them separately would lose them without error.
                     */
                    notes: [
                      selectedAddOns.length
                        ? `Extras requested: ${selectedAddOns.map((a) => a.name).join(", ")}.`
                        : "",
                      /*
                       * The room answers matter as much as the price: the crew
                       * needs to know it is a neglected standard kitchen with an
                       * oven and hood, not just that it cost AED 599.
                       */
                      roomSummary ? `${roomSummary}.` : "",
                      /* What the crew is coming to clean, itemised. */
                      basketSummary ? `Items: ${basketSummary}.` : "",
                      String(form.get("notes") ?? ""),
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .slice(0, 1000),
                  });
                }}
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="customer_name">
                      Full name
                    </label>
                    <input
                      id="customer_name"
                      name="customer_name"
                      required
                      maxLength={100}
                      autoComplete="name"
                      className={field}
                    />
                  </div>
                  <div>
                    <label className={label} htmlFor="phone">
                      Phone / WhatsApp
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      required
                      maxLength={30}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+971 5x xxx xxxx"
                      className={field}
                    />
                  </div>
                </div>

                <div>
                  {/*
                    Required, not optional. The confirmation, arrival details
                    and price all reach the customer by email — without an
                    address the booking is confirmed only inside our own
                    dashboard, and the customer is left with nothing in writing.
                  */}
                  <label className={label} htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    maxLength={255}
                    autoComplete="email"
                    className={field}
                    aria-describedby="email-hint"
                  />
                  <p id="email-hint" className="mt-2 text-xs text-muted-foreground">
                    We send your confirmation and booking reference here.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className={label} htmlFor="emirate">
                      Emirate
                    </label>
                    <select id="emirate" name="emirate" required className={field}>
                      {EMIRATES.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={label} htmlFor="property_type">
                      Property type
                    </label>
                    <select id="property_type" name="property_type" className={field}>
                      {PROPERTY_TYPES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={label} htmlFor="address">
                    Area / address
                  </label>
                  <input
                    id="address"
                    name="address"
                    maxLength={400}
                    autoComplete="street-address"
                    placeholder="Building, area"
                    className={field}
                  />
                </div>

                <div>
                  <label className={label} htmlFor="notes">
                    Anything we should know?
                  </label>
                  <textarea id="notes" name="notes" rows={3} maxLength={1000} className={field} />
                </div>

                <Button
                  type="submit"
                  size="xl"
                  variant="accent"
                  disabled={mutation.isPending}
                  className="mt-2 w-full sm:w-auto"
                >
                  {mutation.isPending ? <Loader2 className="animate-spin" /> : null}
                  Confirm booking request
                </Button>

                <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  We'll call to confirm scope and price. No payment is taken online.
                </p>
              </form>
            </Reveal>
          </div>

          {/* Order summary keeps the earlier choices visible without a scroll. */}
          <Reveal delay={140} className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Your booking
              </h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Service</dt>
                  <dd className="mt-1 font-display font-semibold tracking-tight">{service.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="mt-1 font-medium">
                    {date ? format(parseISO(date), "EEEE d MMMM yyyy") : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Arrival</dt>
                  <dd className="mt-1 font-medium">{time || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="mt-1.5">
                    <PriceBreakdown price={price} lines={basketLines} label="Service" />
                  </dd>
                </div>
                {selectedAddOns.length > 0 ? (
                  <div>
                    <dt className="text-muted-foreground">Extras</dt>
                    <dd className="mt-1.5">
                      <ul className="space-y-1.5">
                        {selectedAddOns.map((a) => (
                          <li key={a.id} className="font-medium leading-snug">
                            {a.name}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">
                Duration is confirmed on the call — it depends on the service and your property.
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
