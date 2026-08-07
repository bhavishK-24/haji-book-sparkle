import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Home } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionHeader } from "@/components/section-header";
import { ServiceCard } from "@/components/service-card";
import { BUSINESS_SERVICES, RETAIL_SERVICES } from "@/lib/company";

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
        <section className="bg-primary-deep text-primary-foreground">
          <div className="container-page py-20 sm:py-24">
            <span className="eyebrow text-primary-foreground/70">Our services</span>
            <h1 className="display-lg mt-5 max-w-3xl">
              Specialist cleaning and maintenance, delivered by our own crews
            </h1>
            <p className="lede mt-4 max-w-2xl text-primary-foreground/80">
              Home services can be booked online in a couple of taps. Commercial
              and contract work is surveyed and quoted by our coordinators.
            </p>
          </div>
        </section>

        <section className="container-page section-y">
          <SectionHeader
            eyebrow={
              <>
                <Home className="mr-1 inline size-3.5" /> For homes — book online
              </>
            }
            title="Pick a service, date and time window"
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {RETAIL_SERVICES.map((service) => (
              <ServiceCard key={service.slug} service={service} variant="book" />
            ))}
          </div>
        </section>

        <section className="bg-sand">
          <div className="container-page section-y">
            <SectionHeader
              eyebrow={
                <>
                  <Building2 className="mr-1 inline size-3.5" /> For business — quoted on
                  site
                </>
              }
              title="Contracts, buildings and manpower"
              description="These services depend on access, volume and scheduling, so they are not bookable online — we survey the site and send a fixed quote."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {BUSINESS_SERVICES.map((service) => (
                <ServiceCard key={service.slug} service={service} variant="quote" />
              ))}
            </div>
            <Link
              to="/business"
              className="link-underline mt-8 inline-block text-sm font-semibold text-primary"
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
