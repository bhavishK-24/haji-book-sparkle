import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, PhoneCall } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import { Reveal } from "@/components/reveal";
import { ServicePhoto } from "@/components/service-photo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  BOOKING_CATEGORIES,
  categoryFromPrice,
  getCategoryPhoto,
  isEnquiryCategory,
  servicesInCategory,
} from "@/data/booking-categories";
import { formatAed } from "@/data/pricing";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/book/")({
  head: () => ({
    meta: [
      { title: "Book a Service | Haji Ahli Cleaning & Maintenance UAE" },
      {
        name: "description",
        content:
          "Choose what you need — home cleaning, single rooms, sofas and carpets, curtains, pest control, windows, marble or water tanks — and pick a date. Every booking is confirmed by email.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: BookIndex,
});

/**
 * Step one of the booking flow: pick a category.
 *
 * Presenting all 35 services at once would be a wall of choice. Grouping to
 * nine categories keeps the first decision small, and the service-level choice
 * then happens inside a context the customer has already committed to.
 */
function BookIndex() {
  const tel = COMPANY.phone.replace(/\s/g, "");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <section className="surface-dark bg-primary-deep text-primary-foreground">
          <div className="container-page py-20 sm:py-24">
            <Reveal className="max-w-2xl">
              <p className="eyebrow text-primary-foreground/55">Booking</p>
              <h1 className="display-xl mt-5">What do you need done?</h1>
              <p className="mt-6 max-w-xl text-[1.0625rem] leading-relaxed text-primary-foreground/75">
                Pick a category to see the options and choose a date. Every booking is confirmed by
                email before we dispatch a crew.
              </p>
              <a
                href={`tel:${tel}`}
                className="link-underline mt-7 inline-flex items-center gap-2 text-sm font-medium text-primary-foreground/70"
              >
                <PhoneCall className="size-4" aria-hidden />
                Or call {COMPANY.phone}
              </a>
            </Reveal>
          </div>
        </section>

        <section className="container-page section-y">
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7">
            {BOOKING_CATEGORIES.map((category, i) => {
              const count = servicesInCategory(category).length;
              // Maintenance trades are surveyed, so promising "choose a date"
              // there would set the wrong expectation before the click.
              const enquiry = isEnquiryCategory(category);
              return (
                <Reveal key={category.slug} delay={(i % 3) * 80}>
                  <Link
                    to="/book/$category"
                    params={{ category: category.slug }}
                    className="group block"
                  >
                    {/*
                      Aspect pinned rather than left to "auto".

                      Auto picks 4:5 for portrait sources and 3:2 for landscape
                      ones, which suits a photo shown on its own. In a grid it
                      breaks the row: eight of the nine category photos are
                      portrait and the curtain one is landscape, so that single
                      card came out short and wide against the rest. The photo
                      crops to the shared frame instead.
                    */}
                    <div className="overflow-hidden rounded-2xl bg-muted">
                      <ServicePhoto
                        photo={getCategoryPhoto(category)}
                        aspect="aspect-4/5"
                        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                        className="transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="mt-5 flex items-start gap-4">
                      <CategoryIcon slug={category.slug} className="size-12" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-4">
                          <h2 className="display-sm transition-colors duration-[var(--dur-base)] group-hover:text-primary">
                            {category.name}
                          </h2>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {count} {count === 1 ? "option" : "options"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Entry price under the name, as on the homepage cards. */}
                    <p className="mt-2 text-sm font-bold text-foreground">
                      {(() => {
                        const from = categoryFromPrice(category);
                        return from ? (
                          <>
                            From {formatAed(from.exclusive)}
                            <span className="font-medium text-muted-foreground"> + VAT</span>
                          </>
                        ) : (
                          <span className="font-semibold text-muted-foreground">
                            Price on quote
                          </span>
                        );
                      })()}
                    </p>
                    <p className="body-card mt-1.5 text-muted-foreground">{category.tagline}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {enquiry ? "Request a survey" : "Choose a date"}
                      <ArrowRight className="size-4 transition-transform duration-[var(--dur-base)] group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </section>

        <section className="border-t border-border bg-sand">
          <div className="container-page section-y-sm">
            <Reveal className="flex flex-wrap items-end justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="display-md">Not sure which one you need?</h2>
                <p className="lede mt-4">
                  Browse the full catalogue to see exactly what each service includes — and what it
                  doesn't.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/services">Browse all services</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/" hash="book-categories">
                    Back to categories
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href={`tel:${tel}`}>
                    <PhoneCall />
                    Talk to a coordinator
                  </a>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
