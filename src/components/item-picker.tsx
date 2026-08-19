import { Minus, Plus } from "lucide-react";
import { MAX_PER_ITEM, type ItemSelection, itemCount, itemsSubtotal } from "@/data/item-selection";
import { formatAed, unitRowsFor } from "@/data/pricing";
import { cn } from "@/lib/utils";

/**
 * Quantity picker for services sold by the piece.
 *
 * Every size is listed with its own stepper, so a customer with a two-seater
 * and a four-seater adds both in one booking rather than choosing whichever is
 * closer and settling it with the crew on the day.
 *
 * The running subtotal sits at the foot rather than beside each row: what
 * someone wants while adding items is the total they are heading towards, and
 * per-line arithmetic on screen invites them to check it rather than trust it.
 */
export function ItemPicker({
  serviceId,
  items,
  onChange,
  unitNoun = "item",
}: {
  serviceId: string;
  items: ItemSelection;
  onChange: (next: ItemSelection) => void;
  /** Singular noun for the screen-reader labels, e.g. "sofa". */
  unitNoun?: string;
}) {
  const rows = unitRowsFor(serviceId).filter((r) => r.priceExVat !== null);
  if (rows.length === 0) return null;

  const setQty = (label: string, qty: number) => {
    const next = { ...items };
    if (qty <= 0) delete next[label];
    else next[label] = Math.min(qty, MAX_PER_ITEM);
    onChange(next);
  };

  const total = itemCount(items);
  const subtotal = itemsSubtotal(serviceId, items);

  return (
    <div>
      <ul className="divide-y divide-border rounded-xl border border-border">
        {rows.map((row) => {
          const qty = items[row.label] ?? 0;
          const chosen = qty > 0;
          return (
            <li
              key={row.label}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3 transition-colors duration-[var(--dur-base)]",
                chosen ? "bg-primary/[0.04]" : undefined,
              )}
            >
              <div className="min-w-0">
                <p className={cn("text-[0.9375rem] leading-snug", chosen && "font-semibold")}>
                  {row.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {formatAed(row.priceExVat as number)} each + VAT
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border p-0.5">
                <button
                  type="button"
                  onClick={() => setQty(row.label, qty - 1)}
                  disabled={qty === 0}
                  aria-label={`One fewer ${row.label} ${unitNoun}`}
                  className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Minus className="size-3.5" aria-hidden />
                </button>
                <output
                  className={cn(
                    "min-w-7 text-center text-sm tabular-nums",
                    chosen ? "font-bold" : "text-muted-foreground",
                  )}
                >
                  {qty}
                </output>
                <button
                  type="button"
                  onClick={() => setQty(row.label, qty + 1)}
                  disabled={qty >= MAX_PER_ITEM}
                  aria-label={`One more ${row.label} ${unitNoun}`}
                  className="grid size-8 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <Plus className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex items-baseline justify-between gap-4 text-sm">
        <span className="text-muted-foreground">
          {total === 0
            ? `Add the ${unitNoun}s you need cleaned`
            : `${total} ${unitNoun}${total === 1 ? "" : "s"} selected`}
        </span>
        {total > 0 ? (
          <span className="font-semibold tabular-nums">{formatAed(subtotal)} + VAT</span>
        ) : null}
      </div>
    </div>
  );
}
