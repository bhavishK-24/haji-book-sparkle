import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  Home as HomeIcon,
  Landmark,
  CalendarDays,
  PhoneCall,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { MaterialsNote } from "@/components/materials-note";
import { Reveal } from "@/components/reveal";
import { ServicePhoto } from "@/components/service-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { BOOKING_CATEGORIES, getCategoryPhoto } from "@/data/booking-categories";
import { ALL_PHOTOS as PHOTOS_ALL } from "@/data/media";
import { CLIENT_WORDMARKS, COMPANY, CORPORATE_ACCOUNTS, STATS } from "@/lib/company";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Haji Ahli Cleaning & Maintenance | Premium UAE Cleaning Company" },
      {
        name: "description",
        content:
          "Exceptional cleaning and maintenance for homes, developments, offices and commercial properties across the UAE. Professional in-house crews and flexible next-day bookings.",
      },
      { property: "og:title", content: "Haji Ahli Cleaning & Maintenance | UAE" },
      {
        property: "og:description",
        content:
          "Trusted by homeowners, real estate developers, construction companies, offices and commercial properties across the UAE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

/**
 * Headline capability groups, each backed by a photo that genuinely shows it.
 *
 * Each links to the booking category it depicts rather than to the full
 * catalogue. Sending all four to `/services` meant clicking a photograph of a
 * carpet being shampooed dropped you at the top of a thirty-five service list
 * to find it again — the picture made a promise the link did not keep.
 */
const CAPABILITIES = [
  {
    photo: PHOTOS_ALL.villaConsoleDetail,
    label: "Homes",
    title: "Residential deep cleaning",
    body: "Deep and intense packages for studios through six-bedroom villas, with the whole property covered in one visit.",
    to: "/book/$category",
    params: { category: "home-cleaning" },
  },
  {
    photo: PHOTOS_ALL.facadeGlassPole,
    label: "Glass",
    title: "Windows, glass & facades",
    body: "Internal and external glass, frames and tracks. Pole-fed and ladder access for shopfronts, atriums and full-height glazing.",
    to: "/book/$category",
    params: { category: "windows-glass" },
  },
  {
    photo: PHOTOS_ALL.carpetShampooResidence,
    label: "Soft furnishing",
    title: "Carpet, sofa & mattress",
    body: "Rotary scrubbing and hot-water extraction for carpets, upholstery and mattresses, in homes and across commercial floors.",
    to: "/book/$category",
    params: { category: "soft-furnishing" },
  },
  {
    photo: PHOTOS_ALL.postConstructionVacuum,
    label: "Handover",
    title: "Post-handover & fit-out",
    body: "Adhesive, cement and paint residue removal with restorative polishing, phased ahead of client walk-throughs.",
    to: "/business",
  },
];

/**
 * Authority, not adjectives.
 *
 * Each point is a verifiable fact about how the company operates or who it
 * has worked for — operating history, the client portfolio, the range of
 * environments, the employment model. Nothing here is a self-assessment of
 * quality, because a customer cannot check that and every competitor claims it.
 */
const DIFFERENTIATORS = [
  {
    icon: Landmark,
    title: `Operating in the UAE since ${COMPANY.established}`,
    body: "Nearly two decades working across the emirates, through every kind of property the region builds — and more than 6,000 jobs completed.",
  },
  {
    icon: Building2,
    title: `${CORPORATE_ACCOUNTS} corporate accounts`,
    body: "Developers, main contractors, interior fit-out specialists and facility managers — including DAMAC, Sobha, Danube, Binghatti and Shapoorji Pallonji.",
  },
  {
    icon: HomeIcon,
    title: "Trusted inside private residences",
    body: "Villas and high-value homes where furniture, finishes and discretion all matter. The same crews work in occupied family homes and on handover sites.",
  },
  {
    icon: UserCheck,
    title: "Directly employed, supervised crews",
    body: "Teams are on the company payroll and work in uniform under a supervisor — never subcontracted out to whoever is available that week.",
  },
];

const PROCESS = [
  {
    title: "Choose your service",
    body: "Tell us the property type and what needs doing.",
  },
  {
    title: "Pick a date",
    body: "Next-day availability on most residential services, seven days a week.",
  },
  {
    title: "We confirm your booking",
    body: "A confirmation email lands with your reference, price and arrival window.",
  },
  {
    title: "Your crew arrives equipped",
    body: "We brief the crew, who bring equipment, materials and supervision. You inspect before sign-off.",
  },
];

function Home() {
  const tel = COMPANY.phone.replace(/\s/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* ── Hero ─────────────────────────────────────────────────────────
            Split rather than full-bleed: the photography is portrait at
            900px wide, so stretching it across a desktop viewport would
            look soft. A tall frame shows it at native resolution. */}
        <section className="surface-dark relative overflow-hidden bg-primary-deep text-primary-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-0 size-[38rem] rounded-full bg-primary/25 blur-[120px]"
          />

          <div className="container-page relative grid items-center gap-14 pb-20 pt-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-28 lg:pt-36">
            <Reveal>
              <h1 className="display-2xl max-w-[13ch]">
                Exceptional cleaning.
                <span className="block text-primary-foreground/55">Professional standards.</span>
                Every time.
              </h1>

              <p className="mt-7 max-w-xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
                Trusted by homeowners, real estate developers, construction companies, offices and
                commercial properties across the UAE. Professional crews, deep cleaning expertise,
                and flexible next-day bookings.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button asChild variant="accent" size="xl" className="group">
                  <Link to="/book">
                    Book a service
                    <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="onDark" size="xl">
                  <Link to="/business">Request a quote</Link>
                </Button>
              </div>

              <a
                href={`tel:${tel}`}
                className="link-underline mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/70"
              >
                <PhoneCall className="size-4" aria-hidden />
                {COMPANY.phone}
              </a>
            </Reveal>

            <Reveal delay={120} className="relative lg:pl-6">
              <div className="relative overflow-hidden rounded-[1.75rem] shadow-lift ring-1 ring-primary-foreground/15">
                <ServicePhoto
                  photo={PHOTOS_ALL.facadeGlassPole}
                  priority
                  aspect="aspect-4/5"
                  sizes="(max-width: 1024px) 92vw, 44vw"
                />
              </div>
            </Reveal>
          </div>

          {/* Proof bar — sits on the seam between hero and page. */}
          <div className="border-t border-primary-foreground/12">
            <div className="container-page">
              <dl className="grid grid-cols-2 md:grid-cols-4">
                {STATS.map((stat, i) => (
                  <Reveal key={stat.label} delay={i * 70} className={cellBorders(i)}>
                    <dt className="font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                      {stat.value}
                    </dt>
                    <dd className="mt-1 text-[0.8125rem] leading-snug text-primary-foreground/60">
                      {stat.label}
                    </dd>
                  </Reveal>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* ── Clients (visual concept preserved from the previous build) ─── */}
        <section className="border-b border-border bg-background">
          <div className="container-page py-16 sm:py-20">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="eyebrow">Trusted by</p>
              <h2 className="display-md mt-4">
                {CORPORATE_ACCOUNTS} corporate accounts across the emirates
              </h2>
              <p className="lede mt-4">
                Developers, main contractors, interior fit-out specialists and property owners rely
                on our crews for scheduled and one-off work.
              </p>
            </Reveal>
          </div>

          <Reveal delay={80} className="marquee-mask space-y-5 overflow-hidden pb-16 sm:pb-20">
            {[CLIENT_WORDMARKS.slice(0, 9), CLIENT_WORDMARKS.slice(9)].map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={rowIndex === 0 ? "marquee-track gap-12" : "marquee-track-reverse gap-12"}
              >
                {[...row, ...row].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="whitespace-nowrap font-display text-base font-semibold tracking-tight text-foreground/40 transition-colors duration-[var(--dur-base)] hover:text-foreground sm:text-lg"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ))}
          </Reveal>
        </section>

        {/* ── Capabilities: editorial, borderless, photo-led ─────────────── */}
        <section className="container-page section-y">
          <Reveal className="flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-xl">
              <p className="eyebrow">What we do</p>
              <h2 className="display-lg mt-5">Specialist work, handled in-house</h2>
            </div>
            <Link to="/services" className="link-underline text-sm font-semibold text-primary">
              View all services
            </Link>
          </Reveal>

          {/*
            No card chrome — the photograph is the card. Borders and shadows
            would compete with the imagery rather than support it.
          */}
          <div className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-6">
            {CAPABILITIES.map((item, i) => (
              <Reveal key={item.title} delay={(i % 4) * 90}>
                <Link
                  to={item.to}
                  {...(item.params ? { params: item.params } : {})}
                  className="group block"
                >
                  <div className="overflow-hidden rounded-2xl bg-muted">
                    <ServicePhoto
                      photo={item.photo}
                      aspect="aspect-4/5"
                      sizes="(max-width: 640px) 90vw, (max-width: 1024px) 44vw, 23vw"
                      className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
                    {item.label}
                  </p>
                  <h3 className="display-sm mt-2.5 transition-colors duration-[var(--dur-base)] group-hover:text-primary">
                    {item.title}
                  </h3>
                  <p className="body-card mt-2.5 text-muted-foreground">{item.body}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── Choose a category, then book ──────────────────────────────
            The first decision in the booking flow lives on the homepage, so
            the customer commits to a category before ever seeing a form. */}
        <section id="book-categories" className="scroll-mt-20 border-t border-border bg-background">
          <div className="container-page section-y">
            <Reveal className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-xl">
                <p className="eyebrow">Book in three steps</p>
                <h2 className="display-lg mt-5">What do you need done?</h2>
                <p className="lede mt-5">
                  Pick a category, choose a date, and we email your confirmation.
                </p>
              </div>
              <Button asChild variant="outline" size="lg">
                <Link to="/services">
                  See all services
                  <ArrowRight />
                </Link>
              </Button>
            </Reveal>

            <ul className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {BOOKING_CATEGORIES.map((category, i) => (
                <Reveal as="li" key={category.slug} delay={(i % 3) * 60}>
                  <Link
                    to="/book/$category"
                    params={{ category: category.slug }}
                    className="group flex h-full items-center gap-4 rounded-2xl border border-border p-3 pr-5 transition-colors duration-[var(--dur-base)] hover:border-primary/40 hover:bg-primary/[0.03]"
                  >
                    <CategoryIcon
                      slug={category.slug}
                      className="size-16 group-hover:border-primary/30"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold tracking-tight">
                        {category.name}
                      </span>
                      <span className="mt-1 block text-sm leading-snug text-muted-foreground">
                        {category.tagline}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-primary opacity-0 transition-all duration-[var(--dur-base)] group-hover:translate-x-0.5 group-hover:opacity-100"
                      aria-hidden
                    />
                  </Link>
                </Reveal>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Two routes in ─────────────────────────────────────────────
            Set as a typographic comparison split by a hairline rather than
            two floating cards — the card treatment read as generic and sat
            apart from the rest of the page. */}
        <section className="bg-sand">
          <div className="container-page section-y">
            <Reveal className="max-w-2xl">
              <p className="eyebrow">How to work with us</p>
              <h2 className="display-lg mt-5">Two ways in</h2>
            </Reveal>

            <div className="mt-16 grid lg:grid-cols-2">
              <Reveal className="flex flex-col border-t border-foreground/15 pt-9 lg:border-r lg:pr-14">
                <p className="font-mono text-xs tracking-widest text-muted-foreground">01</p>
                <h3 className="display-md mt-5 flex items-center gap-3">
                  <CalendarDays className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
                  Homes
                </h3>
                <p className="lede mt-5 max-w-md">
                  Pick your service and a date online. Next-day slots are available on most
                  residential work. We confirm your booking by email, then brief the crew.
                </p>
                <dl className="mt-8 space-y-3 text-sm">
                  <Fact term="Booking" detail="Online, three steps" />
                  <Fact term="Lead time" detail="Next day on most services" />
                  <Fact term="Confirmation" detail="By email, before dispatch" />
                </dl>
                {/* mt-auto pins both CTAs to the same baseline regardless of
                    how much copy sits above them. */}
                <div className="mt-auto pt-9">
                  <Button asChild size="lg" className="group">
                    <Link to="/book">
                      Book a service
                      <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </div>
              </Reveal>

              <Reveal
                delay={120}
                className="flex flex-col mt-14 border-t border-foreground/15 pt-9 lg:mt-0 lg:pl-14"
              >
                <p className="font-mono text-xs tracking-widest text-muted-foreground">02</p>
                <h3 className="display-md mt-5 flex items-center gap-3">
                  <Building2 className="size-5 text-primary" strokeWidth={1.5} aria-hidden />
                  Business
                </h3>
                <p className="lede mt-5 max-w-md">
                  Contracts are scoped against access, volume and schedule, so commercial work is
                  surveyed on site and quoted in writing rather than booked online.
                </p>
                <dl className="mt-8 space-y-3 text-sm">
                  <Fact term="Booking" detail="Survey, then written quote" />
                  <Fact term="Scope" detail="Fixed before work starts" />
                  <Fact term="Contracts" detail="Scheduled or one-off" />
                </dl>
                <div className="mt-auto pt-9">
                  <Button asChild variant="outline" size="lg" className="group">
                    <Link to="/business">
                      Request a quote
                      <ArrowUpRight className="transition-transform duration-[var(--dur-base)] group-hover:-translate-y-0.5" />
                    </Link>
                  </Button>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Why us — asymmetric, hairline-separated ────────────────────── */}
        <section className="container-page section-y">
          <div className="grid gap-14 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
            <Reveal className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow">Why Haji Ahli</p>
              <h2 className="display-lg mt-5 max-w-md text-balance">
                Trusted where the standard is higher
              </h2>
              <p className="lede mt-6 max-w-md">
                Since {COMPANY.established}, Haji Ahli has cleaned and maintained property across
                the UAE &mdash; from private villas and high-value residences to offices, facilities
                and major corporate accounts.
              </p>
              <Button asChild variant="outline" size="lg" className="mt-8">
                <a href={`tel:${tel}`}>
                  <PhoneCall />
                  Speak to a coordinator
                </a>
              </Button>
            </Reveal>

            <div>
              {DIFFERENTIATORS.map((item, i) => (
                <Reveal
                  key={item.title}
                  delay={i * 80}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-5 border-t border-border py-9 first:border-t-0 first:pt-0 sm:gap-7"
                >
                  <span className="icon-chip">
                    <item.icon className="size-5" strokeWidth={1.5} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="display-sm">{item.title}</h3>
                    <p className="body-card mt-2.5 max-w-xl text-muted-foreground">{item.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process over a full-bleed photograph ───────────────────────── */}
        <section className="surface-dark relative isolate overflow-hidden bg-primary-deep text-primary-foreground">
          <ServicePhoto
            photo={PHOTOS_ALL.interiorGlassPole}
            fill
            sizes="100vw"
            className="absolute inset-0 -z-20 opacity-20"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-primary-deep/75" />

          <div className="container-page section-y">
            <Reveal className="max-w-xl">
              <p className="eyebrow text-primary-foreground/55">Booking</p>
              <h2 className="display-lg mt-5">Four steps, no paperwork</h2>
            </Reveal>

            <ol className="mt-14 grid gap-y-12 md:grid-cols-4 md:gap-x-10">
              {PROCESS.map((step, i) => (
                <Reveal as="li" key={step.title} delay={i * 90} className="relative md:pt-10">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 hidden h-px w-full bg-primary-foreground/20 md:block"
                  />
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 hidden size-2 -translate-y-[3.5px] rounded-full bg-accent-soft md:block"
                  />
                  <span className="font-mono text-xs text-primary-foreground/50">Step {i + 1}</span>
                  <h3 className="display-sm mt-3">{step.title}</h3>
                  <p className="body-card mt-2.5 text-primary-foreground/65">{step.body}</p>
                </Reveal>
              ))}
            </ol>

            {/* Stated once, globally — true of every service in the catalogue. */}
            <Reveal delay={140} className="mt-16 max-w-2xl">
              <MaterialsNote tone="dark" />
            </Reveal>
          </div>
        </section>

        {/* ── Closing CTA ───────────────────────────────────────────────── */}
        <section className="container-page section-y">
          <Reveal className="grid gap-10 border-t border-border pt-14 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h2 className="display-lg max-w-xl">Tell us the space. We'll take it from there.</h2>
              <p className="lede mt-5 max-w-md">
                {COMPANY.hours} · {COMPANY.phone} · {COMPANY.email}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="accent" size="xl" className="group">
                <Link to="/book">
                  Book a service
                  <ArrowRight className="transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/business">Commercial quote</Link>
              </Button>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

/** Label/value row used in the "two ways in" comparison. */
function Fact({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="flex gap-4 border-b border-border pb-3">
      <dt className="w-28 shrink-0 text-muted-foreground">{term}</dt>
      <dd className="font-medium">{detail}</dd>
    </div>
  );
}

/**
 * Hairlines for the hero proof bar. Written per cell because the dividers
 * have to change when the grid wraps from 4-up to 2-up.
 */
function cellBorders(i: number) {
  const base = "border-primary-foreground/12 py-7 pr-5 sm:py-8";
  const rules = [
    "",
    "border-l pl-5 sm:pl-7",
    "border-t md:border-l md:border-t-0 md:pl-5 lg:pl-7",
    "border-l border-t pl-5 md:border-t-0 sm:pl-7",
  ];
  return `${base} ${rules[i] ?? ""}`;
}
