import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  Droplets,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Timer,
  UserCheck,
} from "lucide-react";
import heroImage from "@/assets/hero-lobby.jpg";
import commercialImage from "@/assets/commercial-tank.jpg";
import residentialImage from "@/assets/residential-villa.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import {
  BUSINESS_SERVICES,
  CLIENT_WORDMARKS,
  COMPANY,
  INDUSTRIES,
  RETAIL_SERVICES,
  STATS,
} from "@/lib/company";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Haji Ahli Cleaning & Maintenance | Premium UAE Cleaning Company",
      },
      {
        name: "description",
        content:
          "Municipality-approved cleaning and maintenance for hotels, offices, clinics, warehouses and villas across the UAE. Book residential services online or request a commercial quote.",
      },
      { property: "og:title", content: "Haji Ahli Cleaning & Maintenance | UAE" },
      {
        property: "og:description",
        content:
          "Commercial contracts and bookable residential cleaning across all seven emirates — water tanks, disinfection, AC service, deep cleaning and manpower.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const DIFFERENTIATORS = [
  {
    icon: ShieldCheck,
    title: "Approved where it matters",
    body: "Water tank cleaning and disinfection are carried out to Dubai Municipality standards, with written reports issued after every job.",
  },
  {
    icon: UserCheck,
    title: "Our own crews, never subcontracted",
    body: "Uniformed, trained and supervised teams on the company payroll — the same faces return to your site each visit.",
  },
  {
    icon: Timer,
    title: "Answered in hours, not days",
    body: "Surveys arranged the same week, quotes typically back within two hours during business hours.",
  },
  {
    icon: ClipboardCheck,
    title: "Fixed scope, fixed price",
    body: "Every quote lists what is included, the chemicals used and the crew size. No variations after the fact.",
  },
];

const PROCESS = [
  {
    title: "Choose your service",
    body: "Pick from residential services and tell us the property type and emirate.",
  },
  {
    title: "Select a two-hour window",
    body: "Saturday to Thursday, 8:00 to 20:00. Slots update live as they are taken.",
  },
  {
    title: "We confirm by phone",
    body: "A coordinator confirms access, scope and a fixed price before dispatch.",
  },
  {
    title: "Crew arrives equipped",
    body: "Equipment, chemicals and supervision included. You inspect before sign-off.",
  },
];

function Home() {
  const tel = COMPANY.phone.replace(/\s/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        {/* ── Hero ───────────────────────────────────────────── */}
        <section className="relative isolate overflow-hidden bg-primary-deep text-primary-foreground">
          <img
            src={heroImage}
            alt="Haji Ahli technician cleaning floor-to-ceiling glass in a Dubai office lobby at sunrise"
            width={1600}
            height={1100}
            className="absolute inset-0 -z-10 size-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,var(--primary-deep)_18%,color-mix(in_oklab,var(--primary-deep)_72%,transparent)_52%,transparent_88%)]"
          />
          <div className="container-page grid min-h-[86vh] items-end pb-20 pt-28 sm:min-h-[88vh] lg:pb-28">
            <Reveal className="max-w-4xl">
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                <BadgeCheck className="size-3.5 text-accent" />
                Dubai Municipality approved · Est. in the UAE
              </span>
              <h1 className="display-xl mt-7 max-w-4xl text-balance">
                <span className="block">Facilities that never look</span>
                <span className="block text-primary-foreground/55">
                  like they were cleaned.
                </span>
              </h1>
              <p className="lede mt-7 max-w-xl text-primary-foreground/75">
                {COMPANY.shortName} maintains hotels, offices, clinics, warehouses
                and private residences across all seven emirates — with our own
                supervised crews.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/book"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:gap-3.5 hover:shadow-[0_12px_32px_oklch(0.52_0.2_25_/_0.35)]"
                >
                  Book a service
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/25 px-7 py-3.5 text-sm font-medium text-primary-foreground/90 transition-colors duration-300 hover:border-primary-foreground/60 hover:bg-primary-foreground/5"
                >
                  Request commercial quote
                  <ArrowUpRight className="size-4" />
                </Link>
                <a
                  href={`tel:${tel}`}
                  className="link-underline ml-1 hidden text-sm text-primary-foreground/70 sm:inline"
                >
                  or call {COMPANY.phone}
                </a>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── Trusted by ─────────────────────────────────────── */}
        <section className="border-b border-border bg-background">
          <div className="container-page grid gap-12 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20">
            <Reveal>
              <p className="eyebrow">Trusted across the emirates</p>
              <dl className="mt-8 grid grid-cols-2 gap-x-10 gap-y-8">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                      {stat.value}
                    </dt>
                    <dd className="mt-1.5 text-sm leading-snug text-muted-foreground">
                      {stat.label}
                    </dd>
                  </div>
                ))}
              </dl>
            </Reveal>

            <Reveal delay={120} className="marquee-mask overflow-hidden">
              <div className="marquee-track gap-14">
                {[...CLIENT_WORDMARKS, ...CLIENT_WORDMARKS].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="whitespace-nowrap font-display text-lg font-semibold tracking-tight text-foreground/25 transition-colors duration-300 hover:text-foreground/60"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
                From single villas to multi-tower portfolios — scheduled
                contracts, emergency call-outs and one-off deep cleans, all run
                from one coordination desk.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── Services: two distinct tracks ──────────────────── */}
        <section className="section-y">
          <div className="container-page">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">What we do</p>
              <h2 className="display-lg mt-5">Two ways to work with us</h2>
            </Reveal>

            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-border bg-border lg:grid-cols-2">
              {/* Commercial */}
              <Reveal className="flex flex-col bg-primary-deep text-primary-foreground">
                <div className="relative h-64 overflow-hidden sm:h-72">
                  <img
                    src={commercialImage}
                    alt="Technician servicing a stainless steel potable water tank plant room"
                    loading="lazy"
                    width={1200}
                    height={1408}
                    className="size-full object-cover transition-transform duration-[900ms] ease-out hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-9 sm:p-11">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-accent">
                    Commercial
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                    Surveyed on site, quoted in writing
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-primary-foreground/70">
                    Contracts are scoped against access, volume and schedule —
                    so commercial work is quoted, never booked online.
                  </p>
                  <ul className="mt-8 space-y-3 border-t border-primary-foreground/15 pt-8">
                    {BUSINESS_SERVICES.map((s) => (
                      <li
                        key={s.slug}
                        className="flex items-baseline justify-between gap-6 text-sm"
                      >
                        <span className="text-primary-foreground/90">{s.name}</span>
                        {s.approved ? (
                          <span className="shrink-0 text-[0.68rem] uppercase tracking-[0.14em] text-accent">
                            Approved
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/business"
                    className="group mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-primary-foreground/25 px-6 py-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
                  >
                    Request a quote
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </Reveal>

              {/* Residential */}
              <Reveal delay={120} className="flex flex-col bg-card">
                <div className="relative h-64 overflow-hidden sm:h-72">
                  <img
                    src={residentialImage}
                    alt="Housekeeper cleaning a bright modern Dubai villa living room"
                    loading="lazy"
                    width={1200}
                    height={1408}
                    className="size-full object-cover transition-transform duration-[900ms] ease-out hover:scale-[1.04]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-9 sm:p-11">
                  <span className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-primary">
                    Residential
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-bold tracking-tight">
                    Pick a slot, we confirm by phone
                  </h3>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                    Apartments, townhouses and villas — booked online in two-hour
                    windows, Saturday to Thursday.
                  </p>
                  <ul className="mt-8 divide-y divide-border border-t border-border">
                    {RETAIL_SERVICES.map((s) => (
                      <li key={s.slug}>
                        <Link
                          to="/book"
                          search={{ service: s.name }}
                          className="group flex items-center justify-between gap-6 py-3.5 text-sm"
                        >
                          <span className="font-medium">{s.name}</span>
                          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/book"
                    className="group mt-10 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
                  >
                    <CalendarDays className="size-4" />
                    Book now
                  </Link>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Why choose us ──────────────────────────────────── */}
        <section className="bg-sand">
          <div className="container-page section-y">
            <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24">
              <Reveal>
                <p className="eyebrow">Why Haji Ahli</p>
                <h2 className="display-lg mt-5 max-w-sm">
                  The difference is in the standard, not the sales pitch
                </h2>
                <a
                  href={`tel:${tel}`}
                  className="link-underline mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                >
                  <PhoneCall className="size-4" />
                  Speak to a coordinator
                </a>
              </Reveal>

              <div>
                {DIFFERENTIATORS.map((item, i) => (
                  <Reveal
                    key={item.title}
                    delay={i * 80}
                    className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 border-t border-border py-8 last:border-b"
                  >
                    <item.icon
                      className="mt-1 size-5 shrink-0 text-primary"
                      strokeWidth={1.6}
                    />
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {item.body}
                      </p>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Industries ─────────────────────────────────────── */}
        <section className="container-page section-y">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow">Industries</p>
              <h2 className="display-lg mt-5">Where our crews work</h2>
            </div>
            <Link
              to="/services"
              className="link-underline text-sm font-semibold text-primary"
            >
              All services
            </Link>
          </Reveal>

          <ul className="mt-14 grid border-t border-border sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map((industry, i) => (
              <Reveal
                as="li"
                key={industry.name}
                delay={(i % 4) * 70}
                className="group border-b border-border px-1 py-8 transition-colors duration-300 sm:[&:nth-child(odd)]:border-r lg:border-r lg:last:border-r-0 lg:[&:nth-child(4n)]:border-r-0"
              >
                <div className="px-5">
                  <span className="font-mono text-xs text-muted-foreground/60">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-4 font-display text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
                    {industry.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {industry.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* ── Featured work / clients ────────────────────────── */}
        <section className="bg-primary-deep text-primary-foreground">
          <div className="container-page section-y">
            <Reveal className="max-w-2xl">
              <p className="eyebrow text-primary-foreground/50">Selected work</p>
              <h2 className="display-lg mt-5">
                Portfolios that stay maintained, quietly
              </h2>
            </Reveal>

            <div className="mt-16 grid gap-px overflow-hidden rounded-2xl bg-primary-foreground/12 md:grid-cols-3">
              {[
                {
                  icon: Droplets,
                  sector: "Residential towers",
                  headline: "48 potable water tanks, one weekend shutdown",
                  detail:
                    "Drain, scrub, disinfect and certify across a multi-tower community without interrupting supply beyond scheduled windows.",
                },
                {
                  icon: Sparkles,
                  sector: "Hospitality",
                  headline: "Nightly back-of-house across a hotel group",
                  detail:
                    "Kitchens, service corridors and staff areas cleaned to audit standard, with supervisor sign-off before the morning shift.",
                },
                {
                  icon: ClipboardCheck,
                  sector: "Developers",
                  headline: "Post-handover cleaning at unit scale",
                  detail:
                    "Adhesive and cement residue removal plus marble restoration, phased floor by floor ahead of client walk-throughs.",
                },
              ].map((item, i) => (
                <Reveal
                  key={item.headline}
                  delay={i * 100}
                  className="bg-primary-deep p-9 transition-colors duration-500 hover:bg-primary sm:p-11"
                >
                  <item.icon
                    className="size-5 text-accent"
                    strokeWidth={1.6}
                  />
                  <p className="mt-8 text-[0.72rem] uppercase tracking-[0.2em] text-primary-foreground/50">
                    {item.sector}
                  </p>
                  <h3 className="mt-3 font-display text-xl font-semibold leading-snug tracking-tight">
                    {item.headline}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-primary-foreground/65">
                    {item.detail}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Booking process ────────────────────────────────── */}
        <section className="container-page section-y">
          <Reveal className="max-w-xl">
            <p className="eyebrow">Residential booking</p>
            <h2 className="display-lg mt-5">Four steps, no paperwork</h2>
          </Reveal>

          <ol className="mt-16 grid gap-y-12 md:grid-cols-4 md:gap-x-10">
            {PROCESS.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                delay={i * 90}
                className="relative md:pt-10"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 hidden h-px w-full bg-border md:block"
                />
                <span
                  aria-hidden
                  className="absolute left-0 top-0 hidden size-1.5 -translate-y-[3px] rounded-full bg-accent md:block"
                />
                <span className="font-mono text-xs text-muted-foreground/60">
                  Step {i + 1}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.body}
                </p>
              </Reveal>
            ))}
          </ol>
        </section>

        {/* ── CTA banner ─────────────────────────────────────── */}
        <section className="container-page pb-24">
          <Reveal className="overflow-hidden rounded-3xl bg-primary px-8 py-16 text-primary-foreground sm:px-14 sm:py-20">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_auto] lg:items-end">
              <div>
                <h2 className="display-lg max-w-xl">
                  Tell us the space. We'll take it from there.
                </h2>
                <p className="mt-5 max-w-md text-sm leading-relaxed text-primary-foreground/70">
                  {COMPANY.hours} · {COMPANY.phone} · {COMPANY.email}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="group inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-accent-foreground transition-all duration-300 hover:gap-3.5"
                >
                  Book a service
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  to="/business"
                  className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3.5 text-sm font-medium transition-colors hover:bg-primary-foreground/10"
                >
                  Commercial quote
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
