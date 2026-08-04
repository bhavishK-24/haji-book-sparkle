import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import logo from "@/assets/haji-ahli-logo.png.asset.json";
import { BUSINESS_SERVICES, COMPANY, RETAIL_SERVICES } from "@/lib/company";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary-deep text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <span className="inline-flex rounded-lg bg-card p-3">
            <img
              src={logo.url}
              alt="Haji Ahli Cleaning Services logo"
              width={140}
              height={140}
              className="h-16 w-auto"
            />
          </span>
          <h3 className="mt-4 font-display text-base font-bold">{COMPANY.name}</h3>
          <p className="mt-2 max-w-xs text-sm text-primary-foreground/70">
            {COMPANY.tagline}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              For homes
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
              {RETAIL_SERVICES.slice(0, 5).map((s) => (
                <li key={s.slug}>{s.name}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
              For business
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-primary-foreground/75">
              {BUSINESS_SERVICES.map((s) => (
                <li key={s.slug}>{s.name}</li>
              ))}
              <li>
                <Link to="/services" className="underline hover:text-primary-foreground">
                  See all services
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground/60">
            Get in touch
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/80">
            <li className="flex items-center gap-2">
              <Phone className="size-4" />
              <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}>{COMPANY.phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" />
              <a href={`tel:${COMPANY.landline.replace(/\s/g, "")}`}>
                {COMPANY.landline}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="size-4" />
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="size-4" />
              {COMPANY.hours}
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4" />
              {COMPANY.address}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-primary-foreground/10">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-5 text-xs text-primary-foreground/60">
          <span>
            © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
          </span>
          <Link to="/auth" className="hover:text-primary-foreground">
            Staff login
          </Link>
        </div>
      </div>
    </footer>
  );
}
