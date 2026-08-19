import { formatAed, VAT_RATE, type ResolvedPrice } from "@/data/pricing";
import { cn } from "@/lib/utils";

/**
 * Price display.
 *
 * Two modes, because the two jobs are different. While someone is browsing and
 * comparing, prices are shown exclusive of VAT and labelled "+ VAT" — that is
 * how Haji Ahli quotes and how the trade compares. At checkout, where the
 * customer is committing to an amount, the VAT-inclusive total is what they
 * will actually pay, so that is what leads.
 *
 * The "+ VAT" label is not optional in the exclusive mode: an unlabelled
 * exclusive price is the one thing here that would genuinely mislead.
 *
 * When there is no price, this renders an honest "price on quote" rather than
 * a zero, a dash, or nothing at all.
 */
export function PriceTag({
  price,
  size = "default",
  prefix,
  vat = "exclusive",
  emptyLabel = "Price on quote",
  className,
}: {
  price: ResolvedPrice | null;
  size?: "default" | "large";
  /** e.g. "From" — omitted when the price is exact. */
  prefix?: string | undefined;
  /** "exclusive" while browsing, "inclusive" at checkout. */
  vat?: "exclusive" | "inclusive";
  emptyLabel?: string;
  className?: string;
}) {
  if (!price) {
    return (
      <span className={cn("text-sm font-medium text-muted-foreground", className)}>
        {emptyLabel}
      </span>
    );
  }

  const headline = vat === "inclusive" ? price.inclusive : price.exclusive;

  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span className="flex items-baseline gap-1.5">
        {prefix ? (
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <span
          className={cn(
            "font-display font-bold tracking-tight tabular-nums",
            size === "large" ? "text-2xl" : "text-lg",
          )}
        >
          {formatAed(headline)}
        </span>
        {vat === "exclusive" ? (
          <span className="text-sm font-medium text-muted-foreground">+ VAT</span>
        ) : null}
        {price.unitLabel ? (
          <span className="text-sm font-medium text-muted-foreground">{price.unitLabel}</span>
        ) : null}
      </span>
      <span className="mt-0.5 text-xs text-muted-foreground">
        {vat === "inclusive"
          ? `includes ${VAT_RATE * 100}% VAT · ${formatAed(price.exclusive)} before VAT`
          : `${formatAed(price.inclusive)} including VAT`}
        {price.liftedToMinimum ? " · minimum booking value" : ""}
      </span>
    </span>
  );
}
