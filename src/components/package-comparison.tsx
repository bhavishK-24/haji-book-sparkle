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

function Mark({ value }: { value: ScopeInclusion | undefined }) {
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
        <Check className="mx-auto size-4 text-primary" strokeWidth={2.5} aria-hidden />
        <span className="sr-only">Included</span>
      </>
    );
  }
  if (value === "addon") {
    return (
      <>
        <Plus className="mx-auto size-4 text-muted-foreground" strokeWidth={2} aria-hidden />
        <span className="sr-only">Available as a paid extra</span>
      </>
    );
  }
  return (
    <>
      <Minus className="mx-auto size-4 text-muted-foreground/40" strokeWidth={2} aria-hidden />
      <span className="sr-only">Not included</span>
    </>
  );
}

/**
 * Deep vs Intense, reduced to what actually differs.
 *
 * The scope matrix has 28 rows and the two packages agree on 25 of them.
 * Those are summarised once underneath as a shared baseline; the table itself
 * only carries rows where the answer changes, which is the only information
 * that helps someone choose.
 */
export function PackageComparison({ columns }: { columns: readonly string[] }) {
  const rows = packageComparison(columns);
  const common = packageCommonScope(columns);
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] border-collapse text-left">
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
