import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Home } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_SERVICES, COMPANY, RETAIL_SERVICES } from "@/lib/company";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Cleaning & Maintenance Services in the UAE | Haji Ahli" },
      {
        name: "description",
        content:
          "Home services you can book online — deep cleaning, AC service, disinfection, pest control, carpets and marble. Plus contract services for business: water tanks, facilities and manpower.",
      },
      { property: "og:title", content: "Our Services | Haji Ahli Cleaning & Maintenance" },
      {
        property: "og:description",
        content:
          "Bookable home cleaning services and quoted commercial contracts across all seven emirates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-primary-deep py-16 text-primary-foreground">
          <div className="container-page">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/70">
              Our services
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold sm:text-5xl">
              Specialist cleaning and maintenance, delivered by our own crews
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-primary-foreground/80">
              Home services can be booked online in a couple of taps. Commercial
              and contract work is surveyed and quoted by our coordinators.
            </p>
          </div>
        </section>

        <section className="container-page py-16">
          <span className="eyebrow">
            <Home className="mr-1 inline size-3.5" /> For homes — book online
          </span>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Pick a service, date and time window
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {RETAIL_SERVICES.map((service) => (
              <article key={service.slug} className="surface-card flex flex-col p-7">
                <h3 className="font-display text-lg font-bold">{service.name}</h3>
                {service.approved ? (
                  <span className="mt-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
                    Municipality approved
                  </span>
                ) : null}
                <p className="mt-3 flex-1 text-sm text-muted-foreground">
                  {service.summary}
                </p>
                <Link
                  to="/book"
                  search={{ service: service.name }}
                  className="mt-5 w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                >
                  Book this service
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-sand py-16">
          <div className="container-page">
            <span className="eyebrow">
              <Building2 className="mr-1 inline size-3.5" /> For business — quoted on site
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold">
              Contracts, buildings and manpower
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              These services depend on access, volume and scheduling, so they are
              not bookable online — we survey the site and send a fixed quote.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {BUSINESS_SERVICES.map((service) => (
                <article key={service.slug} className="surface-card flex flex-col p-7">
                  <h3 className="font-display text-lg font-bold">{service.name}</h3>
                  {service.approved ? (
                    <span className="mt-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
                      Municipality approved
                    </span>
                  ) : null}
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">
                    {service.summary}
                  </p>
                  <a
                    href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(`Quote request: ${service.name}`)}`}
                    className="mt-5 w-fit rounded-md border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    Request a quote
                  </a>
                </article>
              ))}
            </div>
            <Link
              to="/business"
              className="mt-8 inline-block text-sm font-semibold text-primary hover:underline"
            >
              More about our business services →
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
