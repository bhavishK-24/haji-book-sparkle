import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Mail, PhoneCall } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SectionHeader } from "@/components/section-header";
import { ServiceCard } from "@/components/service-card";
import { Button } from "@/components/ui/button";
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
        <section className="bg-primary-deep text-primary-foreground">
          <div className="container-page py-20 sm:py-24">
            <span className="eyebrow inline-flex items-center gap-2 text-primary-foreground/70">
              <Building2 className="size-3.5" /> For business
            </span>
            <h1 className="display-lg mt-5 max-w-3xl">
              Contract cleaning, water tanks and manpower for UAE facilities
            </h1>
            <p className="lede mt-4 max-w-2xl text-primary-foreground/80">
              Commercial work is scoped on site, not booked online. Send us the
              details and our coordinator arranges a survey and a fixed written
              quote.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="cta" size="pill" className="font-bold">
                <a href={`tel:${tel}`}>
                  <PhoneCall className="size-4" />
                  {COMPANY.phone}
                </a>
              </Button>
              <Button
                asChild
                variant="cta-outline"
                size="pill"
                className="font-semibold text-primary-foreground"
              >
                <a href={`mailto:${COMPANY.email}?subject=Commercial%20cleaning%20enquiry`}>
                  <Mail className="size-4" />
                  Request a quote
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page section-y">
          <SectionHeader eyebrow="Business services" title="Scoped and quoted by our team" />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {BUSINESS_SERVICES.map((service) => (
              <ServiceCard key={service.slug} service={service} variant="quote" />
            ))}
          </div>
          <p className="mt-8 text-sm text-muted-foreground">
            Looking for a home service instead?{" "}
            <Link to="/book" className="link-underline font-semibold text-primary">
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
