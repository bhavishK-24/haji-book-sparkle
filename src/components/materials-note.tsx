import { PackageOpen } from "lucide-react";
import { MATERIALS_POLICY } from "@/lib/company";
import { cn } from "@/lib/utils";

/**
 * The "we bring everything" statement.
 *
 * Deliberately a single global component rather than a line inside each
 * package's inclusions — it is true of every service, and repeating it would
 * re-inflate the scope lists that exist to show what actually differs.
 */
export function MaterialsNote({
  tone = "light",
  className,
}: {
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-2xl border p-5 sm:p-6",
        tone === "light"
          ? "border-primary/15 bg-primary/[0.03]"
          : "border-primary-foreground/15 bg-primary-foreground/[0.05]",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          tone === "light"
            ? "bg-primary/10 text-primary"
            : "bg-primary-foreground/10 text-primary-foreground",
        )}
      >
        <PackageOpen className="size-5" strokeWidth={1.5} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="font-display text-base font-semibold tracking-tight">
          {MATERIALS_POLICY.headline}
        </p>
        <p
          className={cn(
            "body-card mt-1.5",
            tone === "light" ? "text-muted-foreground" : "text-primary-foreground/70",
          )}
        >
          {MATERIALS_POLICY.detail}{" "}
          <span className={tone === "light" ? "text-foreground/70" : undefined}>
            {MATERIALS_POLICY.byoNote}
          </span>
        </p>
      </div>
    </div>
  );
}
