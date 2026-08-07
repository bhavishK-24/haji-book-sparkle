import { cn } from "@/lib/utils";

/** One dt/dd pair for a stats strip. Render inside a parent <dl>. */
export function StatBlock({
  value,
  label,
  tone = "default",
  className,
}: {
  value: string;
  label: string;
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{value}</dt>
      <dd
        className={cn(
          "mt-1.5 text-sm leading-snug",
          tone === "inverse" ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {label}
      </dd>
    </div>
  );
}
