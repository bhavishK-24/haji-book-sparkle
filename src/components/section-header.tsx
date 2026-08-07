import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Canonical "eyebrow + heading (+ description/action)" block.
 * Centralizes the pattern repeated across every marketing section so spacing
 * and heading levels can't drift page to page.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  tone = "default",
  layout = "stack",
  className,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "inverse";
  /** "stack": title block only. "split": title block left, action right (wraps on mobile). */
  layout?: "stack" | "split";
  className?: string;
}) {
  const body = (
    <div className={layout === "split" ? "max-w-xl" : "max-w-2xl"}>
      <p className={cn("eyebrow", tone === "inverse" && "text-primary-foreground/50")}>
        {eyebrow}
      </p>
      <h2 className="display-lg mt-5">{title}</h2>
      {description ? (
        <p className={cn("lede mt-4", tone === "inverse" && "text-primary-foreground/70")}>
          {description}
        </p>
      ) : null}
    </div>
  );

  if (layout === "split") {
    return (
      <div className={cn("flex flex-wrap items-end justify-between gap-6", className)}>
        {body}
        {action}
      </div>
    );
  }

  return (
    <div className={className}>
      {body}
      {action}
    </div>
  );
}
