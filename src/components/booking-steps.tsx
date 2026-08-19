import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const BASE_STEPS = [
  { n: 1, label: "Service" },
  { n: 2, label: "Date & time" },
  { n: 3, label: "Your details" },
] as const;

/** With extras, "Date & time" and "Your details" shift one place right. */
const STEPS_WITH_EXTRAS = [
  { n: 1, label: "Service" },
  { n: 2, label: "Extras" },
  { n: 3, label: "Date & time" },
  { n: 4, label: "Your details" },
] as const;

/**
 * Progress indicator for the three booking pages.
 *
 * Completed steps link backwards so a customer can revise an earlier choice
 * without losing the ones after it — the selections live in the URL, so going
 * back and forward is lossless.
 */
export function BookingSteps({
  current,
  categorySlug,
  backTo,
  withExtras = false,
}: {
  current: 1 | 2 | 3 | 4;
  categorySlug: string;
  /** Search params needed to return to each completed step. */
  backTo?: { service?: string };
  /** True when the chosen service offers add-ons, which inserts a step. */
  withExtras?: boolean;
}) {
  const steps = withExtras ? STEPS_WITH_EXTRAS : BASE_STEPS;

  return (
    <nav aria-label="Booking progress">
      <ol className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {steps.map((step, i) => {
          const done = step.n < current;
          const active = step.n === current;

          const content = (
            <span className="flex items-center gap-2.5">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                  active && "bg-primary text-primary-foreground",
                  done && "bg-primary/15 text-primary",
                  !active && !done && "border border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" strokeWidth={3} /> : step.n}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </span>
          );

          return (
            <li key={step.n} className="flex items-center gap-3">
              {done ? (
                step.n === 1 ? (
                  <Link
                    to="/book/$category"
                    params={{ category: categorySlug }}
                    className="rounded-full transition-opacity hover:opacity-70"
                  >
                    {content}
                  </Link>
                ) : (
                  <Link
                    to="/book/$category/schedule"
                    params={{ category: categorySlug }}
                    search={{ service: backTo?.service ?? "" }}
                    className="rounded-full transition-opacity hover:opacity-70"
                  >
                    {content}
                  </Link>
                )
              ) : (
                <span aria-current={active ? "step" : undefined}>{content}</span>
              )}

              {i < steps.length - 1 ? (
                <span aria-hidden className="hidden h-px w-8 bg-border sm:block" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
