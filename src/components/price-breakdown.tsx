import type { ItemLine } from "@/data/item-selection";
import { VAT_RATE, formatAed, type ResolvedPrice } from "@/data/pricing";
import { cn } from "@/lib/utils";

/**
 * The itemised total shown at booking confirmation.
 *
 * A single VAT-inclusive figure is right for browsing — it is what the customer
 * pays and what UAE rules require to be advertised. At the point of committing,
 * though, they are entitled to see the arithmetic: what the work costs, what tax
 * is added, and what the total is. It is also what a customer expecting a tax
 * invoice looks for before they trust the number.
 *
 * Renders nothing rather than zeros when there is no price — an unpriced
 * booking says so in words elsewhere.
 */
export function PriceBreakdown({
  price,
  label = "Service",
  lines,
  note,
  className,
}: {
  price: ResolvedPrice | null;
  /** Per-item lines, where the customer chose several pieces. */
  lines?: ItemLine[] | null | undefined;
  /** What the base line is called, e.g. "Package". */
  label?: string;
  /** Optional line under the total, e.g. why extras are not included. */
  note?: string | null;
  className?: string;
}) {
  if (!price) {
    return (
      <p className={cn("text-sm font-medium text-muted-foreground", className)}>
        Quoted on confirmation
      </p>
    );
  }

  return (
    <div className={cn("rounded-xl border border-border bg-secondary/40 p-4", className)}>
      <dl className="space-y-2 text-sm">
        {/*
          Itemised where the customer built a basket. Someone booking two
          sofas and a recliner is entitled to see which is which before they
          commit, rather than one total they have to take on trust.
        */}
        {lines && lines.length > 0 ? (
          lines.map((line) => (
            <div key={line.label} className="flex items-baseline justify-between gap-4">
              <dt className="text-muted-foreground">
                {line.quantity} × {line.label}
              </dt>
              <dd className="tabular-nums">{formatAed(line.lineTotal)}</dd>
            </div>
          ))
        ) : (
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular-nums">{formatAed(price.exclusive)}</dd>
          </div>
        )}

        {price.liftedToMinimum ? (
          <p className="text-xs leading-snug text-muted-foreground">
            Minimum booking value applied.
          </p>
        ) : null}

        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">VAT ({VAT_RATE * 100}%)</dt>
          <dd className="tabular-nums">{formatAed(price.vat)}</dd>
        </div>

        <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2.5">
          <dt className="font-semibold text-foreground">Total</dt>
          <dd className="font-display text-lg font-bold tabular-nums text-foreground">
            {formatAed(price.inclusive)}
          </dd>
        </div>
      </dl>

      {note ? <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{note}</p> : null}
    </div>
  );
}
