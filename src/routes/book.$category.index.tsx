import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Mail, Minus, PhoneCall, ShieldCheck } from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { BookingPricePanel } from "@/components/booking-price-panel";
import { BookingSteps } from "@/components/booking-steps";
import { CategoryIcon } from "@/components/category-icon";
import { MaterialsNote } from "@/components/materials-note";
import { PackageComparison } from "@/components/package-comparison";
import { PropertyPriceTable, UnitPriceTable } from "@/components/price-table";
import {
  type Furnishing,
  PropertySelector,
  type PropertySize,
} from "@/components/property-selector";
import { Reveal } from "@/components/reveal";
import { ServicePhoto } from "@/components/service-photo";
import { ItemPicker } from "@/components/item-picker";
import { WhatsAppQuotePanel } from "@/components/whatsapp-quote-panel";
import { Button } from "@/components/ui/button";
import { addOnsForService, isOnlineBookable, packageAdds, PACKAGE_SCOPE_COLUMNS } from "@/data";
import {
  emptyBathroomSelection,
  emptyKitchenSelection,
  isConfigured,
  isVideoQuoted,
  priceBathroom,
  priceKitchen,
} from "@/data/configured/engine";
import { encodeRoomSelection } from "@/data/configured/url";
import {
  allowsMultipleItems,
  encodeItems,
  type ItemSelection,
  itemCount,
} from "@/data/item-selection";
import {
  getBookingCategory,
  getCategoryPhoto,
  isEnquiryCategory,
  servicesInCategory,
} from "@/data/booking-categories";
import {
  applyMinimumBookingValue,
  formatAed,
  priceFrom,
  propertyRowsFor,
  resolveItemsPrice,
  resolvePropertyPrice,
  resolveUnitPrice,
  unitRowsFor,
} from "@/data/pricing";
import { COMPANY, PEST_WARRANTY } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/book/$category/")({
  /*
   * `/services` links here with `?service=SVC-108` to open a specific service.
   * Without a schema the parameter was accepted into the URL but never read,
   * so "Book this service" landed on an unselected picker and the customer had
   * to find the service again.
   *
   * Optional, and deliberately NOT `.catch("")`. A catch always produces a
   * value, so the router materialised it into the URL and every bare
   * `/book/<category>` answered 307 to `/book/<category>?service=` — which put
   * a redirect behind all nine category URLs in the sitemap. Optional leaves an
   * absent parameter absent.
   *
   * `.catch(undefined)` still guards a malformed value, such as the array a
   * repeated `?service=a&service=b` produces, without reintroducing a default.
   * The id is checked against the category's own services below, so anything
   * unknown simply preselects nothing.
   */
  validateSearch: z.object({
    service: z.string().optional().catch(undefined),
  }),
  head: ({ params }) => {
    const category = getBookingCategory(params.category);
    return {
      meta: [
        /*
         * The search-facing title and description live with the category data,
         * so the nine pages cannot drift apart in tone and a new category is a
         * compile error until it has both.
         */
        { title: category?.seoTitle ?? "Book a Service | Haji Ahli" },
        { name: "description", content: category?.seoDescription ?? "" },
        { property: "og:title", content: category?.seoTitle ?? "Book a Service | Haji Ahli" },
        { property: "og:description", content: category?.seoDescription ?? "" },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: ChooseService,
});

/** Parent layout owns the loader, so read the category from there. */
const categoryRoute = getRouteApi("/book/$category");

function ChooseService() {
  const { category } = categoryRoute.useLoaderData();
  const services = servicesInCategory(category);
  const enquiryOnly = isEnquiryCategory(category);
  const tel = COMPANY.phone.replace(/\s/g, "");

  /*
   * A side-by-side table only means something for a ladder, where each tier
   * contains the one below. Kitchen, bathroom and balcony are three different
   * rooms — tabling them implied a bathroom clean contains a kitchen clean.
   */
  const comparisonColumns = category.tiered
    ? services
        .map((s) => s.scopeColumn)
        .filter(
          (c): c is string =>
            c !== null && (PACKAGE_SCOPE_COLUMNS as readonly string[]).includes(c),
        )
    : [];
  const hasComparison = comparisonColumns.length > 1;

  /*
   * One service at a time.
   *
   * The default comes from the URL — `?service=SVC-108` opens that service —
   * falling back to the only service where a category has just one, and to
   * nothing otherwise. The id is looked up in THIS category's services, so an
   * unknown id, or a real id belonging to another category, preselects nothing
   * rather than pointing at a service the page cannot show.
   */
  const { service: requestedServiceId } = Route.useSearch();
  const defaultId =
    services.find((s) => s.id === requestedServiceId)?.id ??
    (services.length === 1 ? (services[0]?.id ?? null) : null);

  /*
   * A click overrides the default. Scoped to the category on screen so that
   * moving between categories cannot carry a stale selection across — the
   * route component is not remounted when only the `$category` param changes.
   */
  const [chosen, setChosen] = useState<{ slug: string; id: string } | null>(null);
  const selectedId = chosen?.slug === category.slug ? chosen.id : defaultId;
  const setSelectedId = (id: string) => setChosen({ slug: category.slug, id });

  const selected = services.find((s) => s.id === selectedId) ?? null;
  const selectedIndex = selected ? services.indexOf(selected) : -1;

  /* Property drives the price on whole-home packages, so it is asked first. */
  const [size, setSize] = useState<PropertySize | null>(null);
  const [furnishing, setFurnishing] = useState<Furnishing | null>(null);

  /* Kitchen and Bathroom are priced from the room, not the property. */
  const [kitchen, setKitchen] = useState(emptyKitchenSelection);
  const [bathroom, setBathroom] = useState(emptyBathroomSelection);

  /* Band-priced services — windows, curtain steaming — take one choice. */
  const [variant, setVariant] = useState<string | null>(null);

  /* Services sold by the piece take a basket: 1 two-seater and 2 recliners. */
  const [items, setItems] = useState<ItemSelection>({});

  /*
   * What each tier turns on that the tier below does not. Only meaningful in a
   * tiered category — elsewhere the full scope is what the customer needs.
   */
  const adds = packageAdds(comparisonColumns);
  const addsByColumn = new Map(comparisonColumns.map((c, i) => [c, adds[i] ?? []]));
  const selectedAdds =
    category.tiered && selected?.scopeColumn && selectedIndex > 0
      ? (addsByColumn.get(selected.scopeColumn) ?? null)
      : null;

  /*
   * How the selected service prices. Read off the pricing catalogue rather
   * than the Service Master, because that is what actually holds the money.
   */
  const sizedByProperty = services.some((s) => propertyRowsFor(s.id).length > 0);
  const sellsByUnit = Boolean(
    selected && unitRowsFor(selected.id).some((r) => r.priceExVat !== null),
  );

  /* Sold by the piece, so the customer builds a basket rather than picking one. */
  const multiItem = Boolean(selected && allowsMultipleItems(selected.id));
  const chosenCount = itemCount(items);

  /** What one of them is called, for the picker's labels and counts. */
  const unitNoun = !selected
    ? "item"
    : (unitRowsFor(selected.id)[0]?.unit ?? "").replace(/^per\s+/i, "").toLowerCase() || "item";

  const needsProperty = sizedByProperty && (!size || !furnishing);
  const needsVariant = sellsByUnit && (multiItem ? chosenCount === 0 : !variant);

  /* The figure the panel shows for whatever is currently selected. */
  const selectedOutcome = !selected
    ? null
    : selected.id === "SVC-104"
      ? priceKitchen(kitchen)
      : selected.id === "SVC-105"
        ? priceBathroom(bathroom)
        : null;

  /*
   * The minimum booking value is applied once, to the figure the customer is
   * actually being asked to commit to — never to the browsing price list,
   * where it would flatten every cheap variant to the same number.
   */
  const selectedPrice = !selected
    ? null
    : multiItem && chosenCount > 0
      ? applyMinimumBookingValue(resolveItemsPrice(selected.id, items), selected.id)
      : variant && sellsByUnit
        ? applyMinimumBookingValue(resolveUnitPrice(selected.id, variant), selected.id)
        : size && !needsProperty
          ? applyMinimumBookingValue(resolvePropertyPrice(selected.id, size, furnishing))
          : priceFrom(selected.id);

  const selectedIsExact = Boolean(
    selected &&
    ((size && !needsProperty) ||
      (sellsByUnit && (multiItem ? chosenCount > 0 : Boolean(variant)))) &&
    selectedPrice,
  );

  const blockedReason = !selected
    ? null
    : needsProperty
      ? "Choose your property type above first"
      : needsVariant
        ? multiItem
          ? `Add at least one ${unitNoun} above`
          : "Choose which item you need cleaned"
        : selectedOutcome?.kind === "needs-input"
          ? "Answer the questions to see your price"
          : null;

  /**
   * What the customer has chosen travels to the next step in the URL, so the
   * coordinator sees the same figures the customer did and a refresh does not
   * lose the answers.
   */
  const bookSearch = (serviceId: string) => ({
    service: serviceId,
    ...(size ? { size } : {}),
    ...(furnishing ? { furnishing } : {}),
    ...(variant ? { variant } : {}),
    ...(multiItem && chosenCount > 0 ? { items: encodeItems(items) } : {}),
    ...(isConfigured(serviceId) ? { room: encodeRoomSelection(serviceId, kitchen, bathroom) } : {}),
  });

  /* Services with add-ons collect them before the calendar. */
  const bookHref =
    selected && isOnlineBookable(selected)
      ? {
          to:
            addOnsForService(selected).length > 0
              ? "/book/$category/extras"
              : "/book/$category/schedule",
          params: { category: category.slug },
          search: bookSearch(selected.id),
        }
      : null;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <section className="surface-dark bg-primary-deep text-primary-foreground">
        <div className="container-page grid items-center gap-12 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-16">
          <Reveal>
            {/*
              Returns to the category chooser on the homepage rather than a
              separate index page — that is where the journey began.
            */}
            <Link
              to="/"
              hash="book-categories"
              className="link-underline inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/60"
            >
              <ArrowLeft className="size-4" aria-hidden />
              All categories
            </Link>
            <div className="mt-6 flex items-center gap-4">
              <CategoryIcon slug={category.slug} tone="dark" className="size-14 shrink-0" />
              <h1 className="display-xl">{category.name}</h1>
            </div>
            <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
              {category.intro}
            </p>
          </Reveal>

          <Reveal delay={120} className="lg:pl-6">
            <div className="overflow-hidden rounded-[1.5rem] shadow-lift ring-1 ring-primary-foreground/15">
              <ServicePhoto
                photo={getCategoryPhoto(category)}
                priority
                sizes="(max-width: 1024px) 92vw, 42vw"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Steps ────────────────────────────────────────────────────── */}
      {!enquiryOnly ? (
        <div className="border-b border-border bg-background">
          <div className="container-page py-6">
            <BookingSteps current={1} categorySlug={category.slug} />
          </div>
        </div>
      ) : null}

      {/* ── Property first ───────────────────────────────────────────
          Every whole-home price varies by size and furnishing, so the
          property is established before any package is shown. */}
      {sizedByProperty ? (
        <section className="border-b border-border bg-sand">
          <div className="container-page section-y-sm">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">First</p>
              <h2 className="display-md mt-4">Tell us about your property</h2>
              <p className="body-card mt-3 text-muted-foreground">
                Package scope is the same whatever the size — this is what sets your price.
              </p>
            </Reveal>
            <Reveal delay={80} className="mt-8">
              <PropertySelector
                size={size}
                furnishing={furnishing}
                onSize={setSize}
                onFurnishing={setFurnishing}
              />
            </Reveal>
          </div>
        </section>
      ) : null}

      {/* ── Choose a service, price on the right ─────────────────────── */}
      <section className="container-page section-y">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">{sizedByProperty ? "Then" : "Step 1"}</p>
          <h2 className="display-lg mt-4">
            {services.length > 1 ? "Choose your service" : "What's included"}
          </h2>
          {category.chooseHint ? <p className="lede mt-5">{category.chooseHint}</p> : null}
        </Reveal>

        {/*
          Service list left, one price panel right. Prices used to sit under
          each service, which made comparing two packages a scroll and a feat
          of memory. Now the figure updates in place beside the list.
        */}
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-14">
          <div>
            {services.length > 1 ? (
              <Reveal>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {services.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={selectedId === s.id}
                        onClick={() => {
                          setSelectedId(s.id);
                          /* A sofa size means nothing once you switch to carpets. */
                          setVariant(null);
                        }}
                        className={cn(
                          "flex h-full w-full flex-col rounded-2xl border p-5 text-left transition-all duration-[var(--dur-base)]",
                          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
                          selectedId === s.id
                            ? "border-primary bg-primary/[0.05] shadow-soft"
                            : "border-border hover:border-primary/40 hover:bg-secondary/60",
                        )}
                      >
                        <span className="flex items-start gap-2.5">
                          <span
                            aria-hidden
                            className={cn(
                              "mt-1 grid size-[1.125rem] shrink-0 place-items-center rounded-full border transition-colors duration-[var(--dur-base)]",
                              selectedId === s.id
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-foreground/25",
                            )}
                          >
                            {selectedId === s.id ? (
                              <Check className="size-3" strokeWidth={3.5} />
                            ) : null}
                          </span>
                          <span className="font-semibold leading-snug">{s.name}</span>
                        </span>

                        {/*
                          The price sits directly under the name, not at the
                          foot of the card: someone comparing three services
                          reads name then cost, and burying the figure below the
                          description made them scan past it to find it.
                        */}
                        <span className="mt-1.5 pl-[1.625rem] text-sm font-bold text-foreground">
                          {(() => {
                            const from = priceFrom(s.id);
                            if (!from) return "Price on quote";
                            return `From ${formatAed(from.exclusive)} + VAT`;
                          })()}
                        </span>

                        {s.shortDescription ? (
                          <span className="mt-2.5 pl-[1.625rem] text-[0.8125rem] leading-relaxed text-muted-foreground">
                            {s.shortDescription}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            {selected ? (
              <div className={services.length > 1 ? "mt-12 space-y-10" : "space-y-10"}>
                {services.length === 1 && selected.shortDescription ? (
                  <p className="lede max-w-2xl">{selected.shortDescription}</p>
                ) : null}

                {/* Unit-priced services need the item picked before they price. */}
                {/*
                  Sold by the piece — sofas, carpets, mattresses, tanks — so
                  several sizes can go into one visit. Bands like window
                  cleaning stay a single choice, where picking two would mean
                  nothing.
                */}
                {!isConfigured(selected.id) && sellsByUnit && multiItem ? (
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold leading-snug">
                      What do you need cleaned?
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Add as many as you like — they are all done in the same visit.
                    </p>
                    <div className="mt-4 max-w-md">
                      <ItemPicker
                        serviceId={selected.id}
                        items={items}
                        onChange={setItems}
                        unitNoun={unitNoun}
                      />
                    </div>
                  </div>
                ) : !isConfigured(selected.id) && sellsByUnit ? (
                  <div>
                    <h3 className="text-[1.0625rem] font-semibold leading-snug">
                      Which one do you need cleaned?
                    </h3>
                    <div className="mt-4 max-w-md">
                      <UnitPriceTable
                        serviceId={selected.id}
                        selected={variant}
                        onSelect={setVariant}
                      />
                    </div>
                  </div>
                ) : null}

                {/* Every property type, so nobody has to guess before choosing. */}
                {!isConfigured(selected.id) && sizedByProperty ? (
                  <details className="group">
                    <summary className="link-underline inline-flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-primary">
                      See the price for every property type
                    </summary>
                    <div className="mt-5 max-w-xl">
                      <PropertyPriceTable
                        serviceId={selected.id}
                        selected={size}
                        furnishing={furnishing}
                        onSelect={(type, f) => {
                          setSize(type as PropertySize);
                          if (f) setFurnishing(f as Furnishing);
                        }}
                      />
                    </div>
                  </details>
                ) : null}

                {/*
                  For the tiered packages, show only what this one turns on that
                  the tier below does not. The raw scope prose restates the whole
                  of the tier below — accurate, but no help in choosing.
                */}
                {/*
                  The upgrade summary, only where the services form a ladder
                  and this is not the entry tier.
                */}
                {selectedAdds && selectedAdds.length > 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
                    <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {`Everything in ${services[selectedIndex - 1]!.name.replace(
                        "Residential ",
                        "",
                      ).replace(" Cleaning", "")}, plus`}
                    </h4>
                    <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {selectedAdds.map((item) => (
                        <li key={item} className="flex gap-2.5 text-[0.9375rem] leading-snug">
                          <Check
                            className="mt-0.5 size-4 shrink-0 text-primary"
                            strokeWidth={2.5}
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/*
                  The full scope, always. Whatever else is on the page, someone
                  deciding wants the plain list of what they are buying.
                */}
                <div className="grid gap-x-12 gap-y-8 md:grid-cols-2">
                  <ScopeColumn heading="Included" items={selected.included} tone="included" />
                  <ScopeColumn heading="Not included" items={selected.excluded} tone="excluded" />
                </div>

                {/* Stated once per service, because customers always ask. */}
                <MaterialsNote />

                {/* Pest treatments carry a warranty; nothing else does. */}
                {selected.category === "Pest Control & Hygiene" ? (
                  <div className="flex gap-3 rounded-xl border border-primary/25 bg-primary/[0.04] p-4">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold">{PEST_WARRANTY.heading}</p>
                      <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                        {PEST_WARRANTY.body}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-28">
            {/*
              Kitchen and bathroom are quoted from a video on WhatsApp, so they
              get the video panel instead of a price-and-book panel.
            */}
            {selected && isVideoQuoted(selected.id) ? (
              <WhatsAppQuotePanel service={selected} />
            ) : (
              <BookingPricePanel
                service={selected}
                price={selectedPrice}
                outcome={selectedOutcome}
                isExact={selectedIsExact}
                bookable={selected ? isOnlineBookable(selected) : false}
                blockedReason={blockedReason}
                bookHref={bookHref}
              />
            )}
          </aside>
        </div>

        {/* Full side-by-side, for anyone who wants to check a specific item. */}
        {hasComparison ? (
          <Reveal className="mt-20 border-t border-border pt-12">
            <h3 className="display-md">Full comparison</h3>
            <p className="body-card mt-3 max-w-xl text-muted-foreground">
              Every point of difference between them.
            </p>
            <div className="mt-8">
              <PackageComparison columns={comparisonColumns} />
            </div>
          </Reveal>
        ) : null}

        {enquiryOnly ? (
          <Reveal className="mt-16 border-t border-border pt-10">
            <h3 className="display-md">Book a site visit</h3>
            <p className="lede mt-4 max-w-xl">
              Everything here is scoped on site, so we survey first and quote in writing rather than
              asking you to pick a slot blind.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="accent" size="xl">
                <a
                  href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Survey request: ${category.name}`)}`}
                >
                  <Mail />
                  Request a survey
                </a>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href={`tel:${tel}`}>
                  <PhoneCall />
                  {COMPANY.phone}
                </a>
              </Button>
            </div>
          </Reveal>
        ) : null}
      </section>
    </>
  );
}

function ScopeColumn({
  heading,
  items,
  tone,
}: {
  heading: string;
  items: string[];
  tone: "included" | "excluded";
}) {
  if (items.length === 0) return null;
  const Icon = tone === "included" ? Check : Minus;

  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {heading}
      </h4>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed">
            <Icon
              className={cn(
                "mt-1 size-4 shrink-0",
                tone === "included" ? "text-primary" : "text-muted-foreground/60",
              )}
              strokeWidth={tone === "included" ? 2.5 : 2}
              aria-hidden
            />
            <span className={tone === "excluded" ? "text-muted-foreground" : undefined}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
