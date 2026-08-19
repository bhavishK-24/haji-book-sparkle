import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import { PriceTag } from "@/components/price-tag";
import { Reveal } from "@/components/reveal";
import { ServicePhoto } from "@/components/service-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  SERVICES,
  groupByCategory,
  isEnquiryOnly,
  isNextDayEligible,
  isOnlineBookable,
  servesSegment,
  type Service,
} from "@/data";
import {
  BOOKING_CATEGORIES,
  categoryForService,
  getCategoryPhoto,
} from "@/data/booking-categories";
import { priceFrom } from "@/data/pricing";
import { COMPANY } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Cleaning & Maintenance Services in the UAE | Haji Ahli" },
      {
        name: "description",
        content:
          "The full Haji Ahli catalogue — residential cleaning packages, room-specific deep cleaning, upholstery and carpets, curtains and linen, pest control, water tanks, glass, marble and maintenance trades.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ServicesPage,
});

/**
 * Photo for a category section — taken from the first service in the group
 * that belongs to a booking category with a picture. Null when none of them do.
 */
function groupPhoto(group: { services: Array<{ id: string }> }) {
  for (const s of group.services) {
    const c = categoryForService(s.id);
    if (c) return getCategoryPhoto(c);
  }
  return null;
}

/** Anchor id for a category section. */
const anchor = (category: string) =>
  category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * Filters that answer questions a customer actually has, rather than exposing
 * database fields. "Book online" and "Next-day" are the two that change what
 * someone can do today; the segment split is the other real fork.
 */
const FILTERS = [
  { id: "all", label: "All services", match: () => true },
  {
    id: "residential",
    label: "For my home",
    match: (s: Service) => servesSegment(s, "residential"),
  },
  {
    id: "commercial",
    label: "For my business",
    match: (s: Service) => servesSegment(s, "commercial"),
  },
  {
    id: "bookable",
    label: "Book online",
    match: (s: Service) => isOnlineBookable(s),
  },
  {
    id: "nextday",
    label: "Next-day available",
    match: (s: Service) => isNextDayEligible(s),
  },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function ServicesPage() {
  const [filter, setFilter] = useState<FilterId>("all");
  const tel = COMPANY.phone.replace(/\s/g, "");

  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const visible = SERVICES.filter(active.match);
  const groups = groupByCategory(visible).filter((g) => g.services.length > 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <section className="surface-dark bg-primary-deep text-primary-foreground">
          <div className="container-page py-20 sm:py-24">
            <Reveal className="max-w-3xl">
              <p className="eyebrow text-primary-foreground/55">Our services</p>
              <h1 className="display-xl mt-5">
                Everything we do, and exactly what each one covers
              </h1>
              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
                {SERVICES.length} services across cleaning, pest control, water tanks and
                maintenance — delivered by our own trained crews.
              </p>
            </Reveal>

            {/* Jump nav: the page is long, so give it a spine. */}
            <Reveal delay={100}>
              <ul className="mt-10 flex flex-wrap gap-2.5">
                {groups.map((g) => (
                  <li key={g.category}>
                    <a
                      href={`#${anchor(g.category)}`}
                      className="inline-flex rounded-full border border-primary-foreground/25 px-4 py-2 text-sm font-medium text-primary-foreground/85 transition-colors duration-[var(--dur-base)] hover:border-primary-foreground/50 hover:bg-primary-foreground/10"
                    >
                      {g.category}
                      <span className="ml-2 text-primary-foreground/45">{g.services.length}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Filters ──────────────────────────────────────────────────── */}
        <section className="sticky top-[4.5rem] z-30 border-b border-border bg-background/90 backdrop-blur-lg">
          <div className="container-page flex flex-wrap items-center gap-x-2 gap-y-2 py-4">
            {FILTERS.map((f) => {
              const count = SERVICES.filter(f.match).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-[var(--dur-base)]",
                    filter === f.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:border-foreground/25 hover:bg-secondary",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      filter === f.id ? "text-primary-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Book by category ─────────────────────────────────────────── */}
        <section className="border-b border-border bg-background">
          <div className="container-page section-y-sm">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">Ready to book?</p>
              <h2 className="display-md mt-4">Start with what you need done</h2>
            </Reveal>
            <Reveal delay={80}>
              <ul className="mt-8 flex flex-wrap gap-2.5">
                {BOOKING_CATEGORIES.map((c) => (
                  <li key={c.slug}>
                    <Link
                      to="/book/$category"
                      params={{ category: c.slug }}
                      className="group inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-base)] hover:border-primary/40 hover:bg-primary/[0.04]"
                    >
                      {c.name}
                      <ArrowRight className="size-3.5 text-primary opacity-0 transition-all duration-[var(--dur-base)] group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </section>

        {/* ── Catalogue ────────────────────────────────────────────────── */}
        {groups.map((group, gi) => (
          <section
            key={group.category}
            id={anchor(group.category)}
            className={cn("scroll-mt-24", gi % 2 === 1 && "bg-sand")}
          >
            <div className="container-page section-y">
              {/*
                One photograph per category, in the header. Previously it hung
                off the first service and was sticky, so it trailed the reader
                down past every other service in the group.
              */}
              {/*
                Centred, and the photo forced to a landscape frame. These
                pictures are portrait, so an 18rem column rendered them ~22rem
                tall next to three lines of text — with `items-end` that pushed
                the heading to the bottom of the photo and left a band of empty
                space above it.
              */}
              <Reveal className="grid items-center gap-8 lg:grid-cols-[1fr_16rem] lg:gap-14">
                <div className="max-w-xl">
                  <p className="eyebrow">{String(gi + 1).padStart(2, "0")} — Category</p>
                  <h2 className="display-lg mt-4">{group.category}</h2>
                  <p className="mt-4 font-mono text-xs text-muted-foreground">
                    {group.services.length} services
                  </p>
                </div>
                {groupPhoto(group) ? (
                  <div className="overflow-hidden rounded-2xl bg-muted">
                    <ServicePhoto
                      photo={groupPhoto(group)!}
                      aspect="aspect-4/3"
                      sizes="(max-width: 1024px) 90vw, 16rem"
                    />
                  </div>
                ) : null}
              </Reveal>

              <div className="mt-14 space-y-14">
                {group.services.map((service, i) => {
                  const included = service.included;
                  const excluded = service.excluded;
                  const bookCategory = categoryForService(service.id);
                  const enquiry = isEnquiryOnly(service);

                  return (
                    <Reveal
                      as="article"
                      key={service.id}
                      delay={Math.min(i, 3) * 60}
                      className="border-t border-border pt-10"
                    >
                      <div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                            <h3 className="display-md">{service.name}</h3>
                            {service.nextDay === "available" && !enquiry ? (
                              <Badge tone="primary">Next-day available</Badge>
                            ) : null}
                            {enquiry ? <Badge tone="muted">Quoted on site</Badge> : null}
                          </div>

                          {service.shortDescription ? (
                            <p className="lede mt-4 max-w-2xl">{service.shortDescription}</p>
                          ) : null}

                          {!enquiry && priceFrom(service.id) ? (
                            <div className="mt-5">
                              <PriceTag price={priceFrom(service.id)} prefix="From" />
                            </div>
                          ) : null}

                          {service.licenceNote ? (
                            <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
                              {service.licenceNote}
                            </p>
                          ) : null}

                          <div className="mt-8 grid gap-x-12 gap-y-8 sm:grid-cols-2">
                            <ScopeColumn heading="Included" items={included} tone="included" />
                            <ScopeColumn heading="Not included" items={excluded} tone="excluded" />
                          </div>

                          <div className="mt-9 flex flex-wrap gap-3">
                            {enquiry || !bookCategory ? (
                              <Button asChild variant="outline">
                                <Link to="/business">Request a quote</Link>
                              </Button>
                            ) : (
                              <Button asChild className="group">
                                <Link
                                  to="/book/$category"
                                  params={{ category: bookCategory.slug }}
                                  search={{ service: service.id }}
                                >
                                  Book this service
                                  <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </div>
          </section>
        ))}

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="container-page section-y">
          <Reveal className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="display-lg max-w-xl">Not sure where to start?</h2>
              <p className="lede mt-5 max-w-md">
                Tell us about the property and we'll recommend the right service. {COMPANY.hours}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="xl">
                <Link to="/book">Book a service</Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <a href={`tel:${tel}`}>Call {COMPANY.phone}</a>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function Badge({ tone, children }: { tone: "primary" | "muted"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em]",
        tone === "primary"
          ? "border-primary/30 text-primary"
          : "border-border text-muted-foreground",
      )}
    >
      {children}
    </span>
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
