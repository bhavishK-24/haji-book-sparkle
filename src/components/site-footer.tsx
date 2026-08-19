import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import logo128 from "@/assets/brand/haji-ahli-logo-128.png";
import logo256 from "@/assets/brand/haji-ahli-logo-256.png";
import { COMPANY } from "@/lib/company";

/** Grouped by what a visitor is trying to do, not by database category. */
const FOOTER_NAV = [
  {
    heading: "Services",
    links: [
      { label: "All services", to: "/services" },
      { label: "Book a service", to: "/book" },
      { label: "For business", to: "/business" },
    ],
  },
] as const;

/**
 * Legal pages, in the bottom bar rather than the main nav.
 *
 * Customers look for these in the footer of every site, and they should be
 * reachable from every page — a cancellation policy nobody can find before
 * booking is not a policy the customer agreed to.
 */
const LEGAL_LINKS = [
  { label: "Terms", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Cancellation", to: "/cancellation" },
] as const;

const CONTACT = [
  { icon: Phone, label: COMPANY.phone, href: `tel:${COMPANY.phone.replace(/\s/g, "")}` },
  { icon: Phone, label: COMPANY.landline, href: `tel:${COMPANY.landline.replace(/\s/g, "")}` },
  { icon: Mail, label: COMPANY.email, href: `mailto:${COMPANY.email}` },
  { icon: Clock, label: COMPANY.hours, href: null },
  { icon: MapPin, label: COMPANY.address, href: null },
];

export function SiteFooter() {
  return (
    <footer className="surface-dark bg-primary-deep text-primary-foreground">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_1fr_1.2fr] md:gap-16 md:py-20">
        <div>
          {/*
            The logo now carries a real alpha channel, so it sits directly on
            the brand ground without the white plate the old asset needed.
          */}
          <img
            src={logo128}
            srcSet={`${logo128} 128w, ${logo256} 256w`}
            sizes="132px"
            alt=""
            width={1159}
            height={900}
            loading="lazy"
            decoding="async"
            className="h-16 w-auto"
          />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-primary-foreground/70">
            {COMPANY.tagline}
          </p>
          <p className="mt-5 text-xs uppercase tracking-[0.16em] text-primary-foreground/45">
            Operating in the UAE since {COMPANY.established}
          </p>
        </div>

        <nav aria-label="Footer">
          {FOOTER_NAV.map((group) => (
            <div key={group.heading}>
              <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/50">
                {group.heading}
              </h2>
              <ul className="mt-5 space-y-3 text-sm">
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="link-underline text-primary-foreground/80 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/50">
            Get in touch
          </h2>
          <ul className="mt-5 space-y-3.5 text-sm text-primary-foreground/80">
            {CONTACT.map((row) => (
              <li key={row.label} className="flex items-start gap-3">
                <row.icon
                  className="mt-0.5 size-4 shrink-0 text-primary-foreground/45"
                  strokeWidth={1.5}
                  aria-hidden
                />
                {row.href ? (
                  <a href={row.href} className="link-underline">
                    {row.label}
                  </a>
                ) : (
                  <span>{row.label}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-6 text-xs text-primary-foreground/55">
          {/*
            The registered entity and TRN, not the trading name. UAE VAT rules
            require the TRN to be shown wherever VAT-inclusive prices are
            advertised, and every price on this site is VAT-inclusive.
          */}
          <span>
            © {new Date().getFullYear()} {COMPANY.legalName} · TRN {COMPANY.trn}
          </span>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="link-underline hover:text-primary-foreground"
              >
                {link.label}
              </Link>
            ))}
            <Link to="/auth" className="link-underline hover:text-primary-foreground">
              Staff login
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
