import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY, SERVICES } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary-deep text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-bold">{COMPANY.name}</h3>
          <p className="mt-3 max-w-xs text-sm text-primary-foreground/70">
            {COMPANY.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Services
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
            {SERVICES.slice(0, 6).map((s) => (
              <li key={s.slug}>{s.name}</li>
            ))}
            <li>
              <Link to="/services" className="text-accent hover:underline">
                See all services
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
            Get in touch
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2">
              <Phone className="size-4 text-accent" />
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4 text-accent" />
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4 text-accent" />
              {COMPANY.hours}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 text-accent" />
              Serving all seven emirates
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60">
          <span>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <Link to="/auth" className="hover:text-accent">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
