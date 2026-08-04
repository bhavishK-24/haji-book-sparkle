import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SERVICES } from "@/lib/company";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Cleaning & Maintenance Services in the UAE | Haji Ahli" },
      {
        name: "description",
        content:
          "Deep cleaning, glue removal, window cleaning, AC service, water tank cleaning, disinfection, marble polishing, manpower supply, carpet shampooing and pest control.",
      },
      { property: "og:title", content: "Our Services | Haji Ahli Cleaning & Maintenance" },
      {
        property: "og:description",
        content:
          "Ten specialist cleaning and maintenance services delivered across all seven emirates by trained, supervised crews.",
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
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Our services
            </span>
            <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold sm:text-5xl">
              Specialist cleaning and maintenance, delivered by our own crews
            </h1>
          </div>
        </section>

        <section className="container-page py-16">
          <div className="grid gap-4 md:grid-cols-2">
            {SERVICES.map((service) => (
              <article key={service.slug} className="surface-card flex flex-col p-7">
                <h2 className="font-display text-lg font-bold">{service.name}</h2>
                {service.approved ? (
                  <span className="mt-2 w-fit rounded-full bg-accent/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
                    Municipality approved
                  </span>
                ) : null}
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{service.summary}</p>
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
      </main>
      <SiteFooter />
    </div>
  );
}
