import { Link } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMPANY, type Service } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * Single source of truth for rendering a service. Homepage, /services and
 * /business all list the same underlying data — this is the one place that
 * needs to change when the quote flow moves off `mailto:` (Phase 1).
 */
export function ServiceCard({
  service,
  variant,
  className,
}: {
  service: Service;
  /** "book": online booking CTA. "quote": commercial quote-request CTA. */
  variant: "book" | "quote";
  className?: string;
}) {
  return (
    <article className={cn("surface-card flex flex-col p-7", className)}>
      <h3 className="font-display text-lg font-bold tracking-tight">{service.name}</h3>
      {service.approved ? (
        <span className="mt-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-accent-foreground">
          Municipality approved
        </span>
      ) : null}
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
        {service.summary}
      </p>
      {variant === "book" ? (
        <Button asChild variant="cta" size="pill-sm" className="mt-5 w-fit">
          <Link to="/book" search={{ service: service.name }}>
            Book this service
            <ArrowRight className="size-3.5" />
          </Link>
        </Button>
      ) : (
        <Button
          asChild
          variant="cta-outline"
          size="pill-sm"
          className="mt-5 w-fit text-primary"
        >
          <a
            href={`mailto:${COMPANY.email}?subject=${encodeURIComponent(
              `Quote request: ${service.name}`,
            )}`}
          >
            Request a quote
            <ArrowUpRight className="size-3.5" />
          </a>
        </Button>
      )}
    </article>
  );
}
