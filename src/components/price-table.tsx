import { Check } from "lucide-react";
import { FURNISHING_VALUES } from "@/data/pricing-catalogue.generated";
import {
  MINIMUM_BOOKING_VALUE,
  formatAed,
  propertyRowsFor,
  resolvePropertyPrice,
  unitRowsFor,
} from "@/data/pricing";
import { cn } from "@/lib/utils";

/**
 * The full price list for one service, shown up front.
 *
 * Customers comparing cleaning companies want to know what *their* home costs
 * before they commit to a flow, so every property type is listed rather than
 * revealed one selection at a time. The row for the property they pick is
 * highlighted, which makes the table the selector as well as the price list —
 * one thing to read instead of a table and then a separate set of buttons.
 *
 * Prices are shown excluding VAT while browsing, which is how Haji Ahli quotes
 * and how customers compare. VAT is added at checkout, where the customer is
 * committing to an amount, and the table says so beneath itself.
 */
export function PropertyPriceTable({
  serviceId,
  selected,
  furnishing,
  onSelect,
}: {
  serviceId: string;
  selected: string | null;
  furnishing: string | null;
  onSelect?: (propertyType: string, furnishing: string) => void;
}) {
  const rows = propertyRowsFor(serviceId);
  if (rows.length === 0) return null;

  /* Which furnishing columns this service actually prices. */
  const columns = FURNISHING_VALUES.filter((f) => rows.some((r) => r.attribute === f));
  const hasFurnishingSplit = columns.length > 1;
  const propertyTypes = [...new Set(rows.map((r) => r.label))];

  const groups: Array<{ heading: string; types: string[] }> = [
    { heading: "Apartments", types: propertyTypes.filter((t) => !/Villa/.test(t)) },
    { heading: "Villas", types: propertyTypes.filter((t) => /Villa/.test(t)) },
  ].filter((g) => g.types.length > 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[18rem] border-collapse text-left text-sm">
          <caption className="sr-only">Prices by property type, excluding VAT</caption>
          <thead>
            <tr className="border-b border-foreground/15">
              <th scope="col" className="py-3 pr-4 font-semibold">
                Property
              </th>
              {hasFurnishingSplit ? (
                columns.map((c) => (
                  <th key={c} scope="col" className="w-28 px-2 py-3 text-right font-semibold">
                    {c}
                  </th>
                ))
              ) : (
                <th scope="col" className="w-32 px-2 py-3 text-right font-semibold">
                  Price
                </th>
              )}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.heading}>
              {groups.length > 1 ? (
                <tr>
                  <th
                    scope="colgroup"
                    colSpan={hasFurnishingSplit ? columns.length + 1 : 2}
                    className="pb-1.5 pt-6 text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground"
                  >
                    {group.heading}
                  </th>
                </tr>
              ) : null}
              {group.types.map((type) => {
                const cells = hasFurnishingSplit ? columns : [null];
                const rowSelected = selected === type;
                return (
                  <tr
                    key={type}
                    className={cn(
                      "border-b border-border transition-colors duration-[var(--dur-base)]",
                      rowSelected ? "bg-primary/[0.05]" : undefined,
                    )}
                  >
                    <th scope="row" className="py-3 pr-4 text-[0.9375rem] font-normal leading-snug">
                      <span className="inline-flex items-center gap-2">
                        {rowSelected ? (
                          <Check className="size-3.5 text-primary" strokeWidth={3} aria-hidden />
                        ) : null}
                        {type.replace(/\bBedroom\b/, "Bed")}
                      </span>
                    </th>
                    {cells.map((column) => {
                      const price = resolvePropertyPrice(serviceId, type, column);
                      const isSelectedCell =
                        rowSelected && (!hasFurnishingSplit || furnishing === column);
                      const clickable = Boolean(onSelect && price);
                      return (
                        <td key={column ?? "price"} className="px-2 py-2 text-right tabular-nums">
                          {price ? (
                            clickable ? (
                              <button
                                type="button"
                                aria-pressed={isSelectedCell}
                                onClick={() => onSelect?.(type, column ?? "")}
                                className={cn(
                                  "w-full rounded-lg px-2.5 py-1.5 text-right font-semibold transition-colors duration-[var(--dur-base)]",
                                  isSelectedCell
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-secondary",
                                )}
                              >
                                {formatAed(price.exclusive)}
                              </button>
                            ) : (
                              <span className="px-2.5 font-semibold">
                                {formatAed(price.exclusive)}
                              </span>
                            )
                          ) : (
                            <span className="px-2.5 text-xs text-muted-foreground">
                              On site visit
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Prices exclude VAT, which is added at checkout. Nothing is charged until the visit is
        confirmed.
      </p>
    </div>
  );
}

/**
 * The price list for a service priced per item rather than per property —
 * sofas by seat count, tanks by capacity, windows by how many there are.
 */
export function UnitPriceTable({
  serviceId,
  selected,
  onSelect,
}: {
  serviceId: string;
  selected?: string | null;
  onSelect?: (variantLabel: string) => void;
}) {
  /*
   * Only priced rows. A quote-only service's rows are internal costing units —
   * "Job of 10 panels", "Load of 10 items" — and listing them told the customer
   * nothing except that we think in tens. Those services say "price on quote"
   * in the panel instead, and this table renders nothing.
   */
  const rows = unitRowsFor(serviceId).filter((r) => r.priceExVat !== null);
  if (rows.length === 0) return null;

  return (
    <div>
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const isSelected = selected === row.label;
          const price = row.priceExVat;
          /* The floor applies to whole jobs, which every row on this sheet is. */
          const exclusive = price === null ? null : Math.max(price, MINIMUM_BOOKING_VALUE);
          const body = (
            <span className="flex w-full items-baseline justify-between gap-4 py-3.5">
              <span className="inline-flex items-center gap-2 text-[0.9375rem]">
                {isSelected ? (
                  <Check className="size-3.5 text-primary" strokeWidth={3} aria-hidden />
                ) : null}
                {row.label}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {exclusive === null ? (
                  <span className="text-xs font-normal text-muted-foreground">On site visit</span>
                ) : (
                  formatAed(exclusive)
                )}
              </span>
            </span>
          );
          return (
            <li key={`${row.label}-${row.unit ?? ""}`}>
              {onSelect && price !== null ? (
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelect(row.label)}
                  className={cn(
                    "w-full rounded-lg px-2 text-left transition-colors duration-[var(--dur-base)]",
                    isSelected ? "bg-primary/[0.06]" : "hover:bg-secondary",
                  )}
                >
                  {body}
                </button>
              ) : (
                <span className="block px-2">{body}</span>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-muted-foreground">
        Prices exclude VAT, added at checkout. Minimum booking value{" "}
        {formatAed(MINIMUM_BOOKING_VALUE)}.
      </p>
    </div>
  );
}
