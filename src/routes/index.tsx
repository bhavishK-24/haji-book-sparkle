import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import heroImage from "@/assets/hero-cleaning.jpg";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { COMPANY, SERVICES } from "@/lib/company";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "Haji Ahli Cleaning & Maintenance | UAE Cleaning Company",
      },
      {
        name: "description",
        content:
          "Municipality-approved deep cleaning, AC maintenance, water tank cleaning, pest control and manpower supply across the UAE. Book your slot online.",
      },
      { property: "og:title", content: "Haji Ahli Cleaning & Maintenance | UAE" },
      {
        property: "og:description",
        content:
          "Deep cleaning, disinfection, AC service, marble polishing and pest control across all seven emirates. Book a slot online.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TRUST = [
  { icon: ShieldCheck, title: "Municipality approved", text: "Water tank cleaning and disinfection carried out to Dubai Municipality standards." },
  { icon: Users, title: "Trained UAE crews", text: "Uniformed, background-checked teams supervised on every job site." },
  { icon: Clock, title: "Slots that suit you", text: "Two-hour windows, Saturday to Thursday, across all seven emirates." },
];

const STEPS = [
  { icon: CalendarDays, title: "Pick a service & slot", text: "Choose your service, date and two-hour window on the booking calendar." },
  { icon: PhoneCall, title: "We confirm by phone", text: "Our coordinator calls to confirm scope, access and a fixed quote." },
  { icon: Sparkles, title: "Crew arrives on time", text: "Equipment, chemicals and supervision included — you just inspect the result." },
];

function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden bg-primary-deep text-primary-foreground">
          <img
            src={heroImage}
            alt="Haji Ahli cleaning crew polishing the floor of a modern Dubai office"
            width={1600}
            height={1104}
            className="absolute inset-0 size-full object-cover opacity-30"
          />
          <div className="container-page relative grid gap-10 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                <BadgeCheck className="size-3.5" /> Dubai Municipality approved
              </span>
              <h1 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
                Spotless offices, villas and warehouses across the UAE.
              </h1>
              <p className="mt-5 max-w-xl text-base text-primary-foreground/80 sm:text-lg">
                {COMPANY.name} delivers deep cleaning, AC maintenance, disinfection,
                marble polishing, pest control and monthly manpower — booked in a
                couple of taps.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/book"
                  className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground transition-transform hover:-translate-y-0.5"
                >
                  <CalendarDays className="size-4" />
                  Book a slot
                </Link>
                <a
                  href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-md border border-primary-foreground/30 px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <PhoneCall className="size-4" />
                  {COMPANY.phone}
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="container-page -mt-10 relative grid gap-4 sm:grid-cols-3">
          {TRUST.map((item) => (
            <div key={item.title} className="surface-card p-6">
              <item.icon className="size-6 text-primary" />
              <h2 className="mt-3 font-display text-base font-bold">{item.title}</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </section>

        <section className="container-page py-20">
          <span className="eyebrow">What we do</span>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold sm:text-4xl">
            One contractor for cleaning, maintenance and manpower
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <article key={service.slug} className="surface-card flex flex-col p-6">
                <h3 className="font-display text-base font-bold">{service.name}</h3>
                {service.approved ? (
                  <span className="mt-2 w-fit rounded-full bg-accent/20 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
                    Municipality approved
                  </span>
                ) : null}
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{service.summary}</p>
                <Link
                  to="/book"
                  className="mt-4 text-sm font-semibold text-primary hover:underline"
                >
                  Book this service →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-sand py-20">
          <div className="container-page">
            <span className="eyebrow">How booking works</span>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Three steps, no paperwork
            </h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div key={step.title} className="surface-card p-6">
                  <span className="font-display text-3xl font-bold text-accent">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 flex items-center gap-2 font-display text-base font-bold">
                    <step.icon className="size-4 text-primary" />
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-20">
          <div className="surface-card flex flex-col items-start justify-between gap-6 bg-primary p-10 text-primary-foreground sm:flex-row sm:items-center">
            <div>
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                Ready for a spotless space?
              </h2>
              <p className="mt-2 text-sm text-primary-foreground/80">
                Pick your slot online — we confirm within business hours.
              </p>
            </div>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-6 py-3 text-sm font-bold text-accent-foreground"
            >
              <CalendarDays className="size-4" />
              Book a slot
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
