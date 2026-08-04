import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Mail, PhoneCall } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BUSINESS_SERVICES, COMPANY } from "@/lib/company";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Commercial Cleaning & Facility Contracts UAE | Haji Ahli" },
      {
        name: "description",
        content:
          "Water tank cleaning, post-handover cleaning, facility deep cleaning and monthly manpower supply for buildings, developers and facility managers across the UAE.",
      },
      { property: "og:title", content: "For Business | Haji Ahli Cleaning & Maintenance" },
      {
        property: "og:description",
        content:
          "Contract cleaning, municipality-approved water tank cleaning and manpower supply for UAE businesses. Request a site survey and quote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  const tel = COMPANY.phone.replace(/\s/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-primary-deep py-16 text-primary-foreground">
          <div className="container-page">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/70">
              <Building2 className="size-3.5" /> For business
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold sm:text-5xl">
              Contract cleaning, water tanks and manpower for UAE facilities
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-primary-foreground/80">
              Commercial work is scoped on site, not booked online. Send us the
              details and our coordinator arranges a survey and a fixed written
              quote.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`tel:${tel}`}
                className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
              >
                <PhoneCall className="size-4" />
                {COMPANY.phone}
              </a>
              <a
                href={`mailto:${COMPANY.email}?subject=Commercial%20cleaning%20enquiry`}
                className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-semibold hover:bg-primary-foreground/10"
              >
                <Mail className="size-4" />
                Request a quote
              </a>
            </div>
          </div>
        </section>

        <section className="container-page py-16">
          <span className="eyebrow">Business services</span>
          <h2 className="mt-2 font-display text-3xl font-bold">
            Scoped and quoted by our team
          </h2>
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
                  className="mt-5 w-fit rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-deep"
                >
                  Request a quote
                </a>
              </article>
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for a home service instead?{" "}
            <Link to="/book" className="font-semibold text-primary hover:underline">
              Book a slot online
            </Link>
            .
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
