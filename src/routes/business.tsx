import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, Check, Mail, Minus, PhoneCall } from "lucide-react";
import { Reveal } from "@/components/reveal";
import { ServicePhoto } from "@/components/service-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { businessGroups, businessServices } from "@/data/business-services";
import { ALL_PHOTOS } from "@/data/media";
import { CLIENT_WORDMARKS, COMPANY, CORPORATE_ACCOUNTS } from "@/lib/company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Commercial Cleaning & Facility Services UAE | Haji Ahli" },
      {
        name: "description",
        content:
          "Contract cleaning, water tank cleaning and disinfection, post-handover cleaning, facility deep cleaning and manpower supply for developers, contractors and facility managers across the UAE.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BusinessPage,
});

/** How commercial work is actually run, stated as facts not adjectives. */
const OPERATING_MODEL = [
  {
    term: "Scoping",
    detail:
      "Site survey before any figure is quoted — access, volume and schedule drive the price.",
  },
  {
    term: "Crews",
    detail: "Directly employed, uniformed teams under a named supervisor. No subcontracting.",
  },
  {
    term: "Scheduling",
    detail: "Nightly, weekly or one-off. Work phased around trading hours and handover dates.",
  },
  {
    term: "Coverage",
    detail: "Dubai, Sharjah and Ajman, with crews mobilised across the northern emirates.",
  },
];

function BusinessPage() {
  const tel = COMPANY.phone.replace(/\s/g, "");
  const mailto = (subject: string) =>
    `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}`;

  // The explicit business catalogue, in the order the business defines it.
  const groups = businessGroups();
  const allBusiness = businessServices();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* ── Header ───────────────────────────────────────────────────── */}
        <section className="surface-dark bg-primary-deep text-primary-foreground">
          <div className="container-page grid items-center gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-24">
            <Reveal>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 py-1.5 pl-3 pr-4 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground/85">
                <Building2 className="size-3.5 text-accent-soft" strokeWidth={2} />
                For business
              </span>
              <h1 className="display-xl mt-7 max-w-[15ch]">Facilities work, run to a schedule</h1>
              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
                We serve every kind of commercial space — offices, hotels, schools, warehouses,
                retail units, clinics and residential towers. {CORPORATE_ACCOUNTS}
                corporate accounts across the emirates, all surveyed on site and quoted in writing.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild variant="accent" size="xl">
                  <a href={mailto("Commercial enquiry")}>
                    <Mail />
                    Request a survey
                  </a>
                </Button>
                <Button asChild variant="onDark" size="xl">
                  <a href={`tel:${tel}`}>
                    <PhoneCall />
                    {COMPANY.phone}
                  </a>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={120} className="lg:pl-6">
              <div className="overflow-hidden rounded-[1.5rem] shadow-lift ring-1 ring-primary-foreground/15">
                <ServicePhoto
                  photo={ALL_PHOTOS.ladderHighLevelAccess}
                  priority
                  aspect="aspect-4/5"
                  sizes="(max-width: 1024px) 92vw, 44vw"
                />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Clients ──────────────────────────────────────────────────── */}
        <section className="border-b border-border bg-background">
          <div className="container-page py-14 sm:py-16">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">A selection of our accounts</p>
            </Reveal>
          </div>
          <Reveal delay={60} className="marquee-mask overflow-hidden pb-14 sm:pb-16">
            <div className="marquee-track gap-12">
              {[...CLIENT_WORDMARKS, ...CLIENT_WORDMARKS].map((name, i) => (
                <span
                  key={`${name}-${i}`}
                  className="whitespace-nowrap font-display text-base font-semibold tracking-tight text-foreground/40 sm:text-lg"
                >
                  {name}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ── Operating model ──────────────────────────────────────────── */}
        <section className="container-page section-y">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <Reveal>
              <p className="eyebrow">How we work</p>
              <h2 className="display-lg mt-5 max-w-sm text-balance">Scoped before it is priced</h2>
            </Reveal>
            <Reveal delay={100}>
              <dl className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
                {OPERATING_MODEL.map((row) => (
                  <div key={row.term} className="border-t border-border pt-5">
                    <dt className="font-display text-base font-semibold tracking-tight">
                      {row.term}
                    </dt>
                    <dd className="body-card mt-2 text-muted-foreground">{row.detail}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
        </section>

        {/* ── Commercial catalogue ─────────────────────────────────────── */}
        {groups.map((group, gi) => (
          <section key={group.heading} className={cn(gi % 2 === 0 && "bg-sand")}>
            <div className="container-page section-y">
              <Reveal className="flex flex-wrap items-end justify-between gap-6">
                <div className="max-w-xl">
                  <p className="eyebrow">{String(gi + 1).padStart(2, "0")}</p>
                  <h2 className="display-lg mt-4">{group.heading}</h2>
                  <p className="lede mt-4">{group.blurb}</p>
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {group.services.length} services
                </span>
              </Reveal>

              <div className="mt-12 space-y-12">
                {group.services.map((service, i) => (
                  <Reveal
                    as="article"
                    key={service.id}
                    delay={Math.min(i, 3) * 60}
                    className="border-t border-border pt-8"
                  >
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <h3 className="display-md">{service.name}</h3>
                      {service.certificateIssued ? (
                        <span className="rounded-full border border-primary/30 px-2.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-primary">
                          Certificate issued
                        </span>
                      ) : null}
                    </div>

                    {service.shortDescription ? (
                      <p className="lede mt-4 max-w-2xl">{service.shortDescription}</p>
                    ) : null}
                    {service.licenceNote ? (
                      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                        {service.licenceNote}
                      </p>
                    ) : null}

                    {service.included.length > 0 || service.excluded.length > 0 ? (
                      <div className="mt-7 grid gap-x-12 gap-y-8 md:grid-cols-2">
                        <ScopeColumn heading="Included" items={service.included} tone="included" />
                        <ScopeColumn
                          heading="Not included"
                          items={service.excluded}
                          tone="excluded"
                        />
                      </div>
                    ) : null}

                    <Button asChild variant="outline" className="mt-8">
                      <a href={mailto(`Quote request: ${service.name}`)}>
                        Request a quote
                        <ArrowRight />
                      </a>
                    </Button>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="container-page section-y">
          <Reveal className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="display-lg max-w-xl">Tell us about the site.</h2>
              <p className="lede mt-5 max-w-md">
                Send the scope, access details and schedule, and a coordinator arranges a survey.{" "}
                {COMPANY.hours}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="xl">
                <a href={mailto("Commercial enquiry")}>
                  <Mail />
                  Request a survey
                </a>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/services">All services</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
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
