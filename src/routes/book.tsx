import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BookingForm } from "@/components/booking-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { COMPANY } from "@/lib/company";

export const Route = createFileRoute("/book")({
  validateSearch: z.object({ service: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Book a Cleaning Slot Online | Haji Ahli UAE" },
      {
        name: "description",
        content:
          "Choose your service, date and two-hour time window. Haji Ahli confirms every booking by phone across Dubai, Abu Dhabi, Sharjah and the northern emirates.",
      },
      { property: "og:title", content: "Book a Cleaning Slot | Haji Ahli" },
      {
        property: "og:description",
        content:
          "Pick a date and time window for deep cleaning, AC service, disinfection, pest control and more.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { service } = Route.useSearch();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="bg-primary-deep py-14 text-primary-foreground">
          <div className="container-page">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Booking
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
              Reserve your slot
            </h1>
            <p className="mt-3 max-w-xl text-sm text-primary-foreground/80">
              {COMPANY.hours}. Pick a date and window that suits you — we confirm by
              phone with a fixed quote.
            </p>
          </div>
        </section>

        <section className="container-page py-14">
          <BookingForm defaultService={service} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
