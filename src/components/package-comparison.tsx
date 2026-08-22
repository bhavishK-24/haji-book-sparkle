import { Check, Minus, Plus } from "lucide-react";
import { packageCommonScope, packageComparison } from "@/data";
import type { ScopeInclusion } from "@/data";
import { cn } from "@/lib/utils";

/** Short column labels — the full names repeat "Residential … Cleaning". */
const SHORT_LABEL: Record<string, string> = {
  "Residential Deep Cleaning": "Deep",
  "Residential Intense Deep Cleaning": "Intense",
  "Kitchen Deep Cleaning": "Kitchen",
  "Bathroom Deep Cleaning": "Bathroom",
  "Balcony Deep Cleaning": "Balcony",
};

function Mark({ value, centred = true }: { value: ScopeInclusion | undefined; centred?: boolean }) {
  /* Grades are words, not marks — see ScopeInclusion. */
  if (value === "medium" || value === "intense") {
    return (
      <span
        className={cn(
          "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
          value === "intense" ? "bg-primary text-primary-foreground" : "bg-secondary",
        )}
      >
        {value}
      </span>
    );
  }
  if (value === "core" || value === "included") {
    return (
      <>
        <Check
          className={cn("size-4 text-primary", centred && "mx-auto")}
          strokeWidth={2.5}
          aria-hidden
        />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === "addon") {
    return (
      <>
        <Plus
          className={cn("size-4 text-muted-foreground", centred && "mx-auto")}
          strokeWidth={2}
          aria-hidden
        />
        <span className="sr-only">Available as a paid extra</span>
      </>
    );
  }
  return (
    <>
      <Minus
        className={cn("size-4 text-muted-foreground/40", centred && "mx-auto")}
        strokeWidth={2}
        aria-hidden
      />
      <span className="sr-only">Not included</span>
    </>
  );
}

/**
 * Deep vs Intense, reduced to what actually differs.
 *
 * The scope matrix has 28 rows and the two packages agree on 25 of them.
 * Those are summarised once underneath as a shared baseline; the comparison
 * itself only carries rows where the answer changes, which is the only
 * information that helps someone choose.
 *
 * Two layouts, because a comparison table has a floor on how narrow it can be
 * and a phone is below it. At 34rem the table was wider than any phone, and
 * `overflow-x-auto` around it was not the answer: it made the whole page drag
 * sideways into white space, and a customer who never discovered they could
 * scroll the table simply never saw the second column — which is the entire
 * point of a comparison.
 *
 * So phones get the same rows as a stacked list, with both packages labelled
 * under each item. Nothing is hidden, nothing scrolls, and the information is
 * identical; only the shape changes. The table returns at `sm`, where it fits.
 */
export function PackageComparison({ columns }: { columns: readonly string[] }) {
  const rows = packageComparison(columns);
  const common = packageCommonScope(columns);
  if (rows.length === 0) return null;

  return (
    <div>
      {/* Phones: one block per difference, both packages named. */}
      <ul className="border-t border-foreground/15 sm:hidden">
        {rows.map((row) => (
          <li key={row.item} className="border-b border-border py-4">
            <p className="text-[0.9375rem] font-semibold leading-snug">{row.item}</p>
            <dl className="mt-3 flex flex-wrap gap-x-7 gap-y-2.5">
              {row.values.map((v, i) => (
                <div key={columns[i]} className="flex items-center gap-2">
                  <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
                    {SHORT_LABEL[columns[i] ?? ""] ?? columns[i]}
                  </dt>
                  <dd className="flex items-center">
                    <Mark value={v} centred={false} />
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Tablet and up, where a side-by-side table fits without scrolling. */}
      <div className="hidden sm:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">What each residential cleaning package includes</caption>
          <thead>
            <tr className="border-b border-foreground/15">
              <th scope="col" className="py-4 pr-4 text-sm font-semibold">
                What changes between packages
              </th>
              {columns.map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="w-24 px-2 py-4 text-center font-display text-sm font-bold tracking-tight"
                >
                  {SHORT_LABEL[c] ?? c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.item} className="border-b border-border">
                <th scope="row" className="py-3.5 pr-4 text-[0.9375rem] font-normal leading-snug">
                  {row.item}
                </th>
                {row.values.map((v, i) => (
                  <td
                    key={columns[i]}
                    className={cn(
                      "px-2 py-3.5 text-center",
                      v === "core" || v === "included" ? "bg-primary/[0.03]" : undefined,
                    )}
                  >
                    <Mark value={v} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Check className="size-3.5 text-primary" strokeWidth={2.5} aria-hidden /> Included
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Plus className="size-3.5" strokeWidth={2} aria-hidden /> Available as a paid extra
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Minus className="size-3.5 opacity-50" strokeWidth={2} aria-hidden /> Not included
        </span>
      </div>

      {common.length > 0 ? (
        <p className="body-card mt-7 max-w-2xl text-muted-foreground">
          <span className="font-semibold text-foreground">Every package includes:</span>{" "}
          {common.map((c) => c.toLowerCase()).join(", ")}.
        </p>
      ) : null}
    </div>
  );
}
