import { Check } from "lucide-react";
import { FURNISHING_VALUES, PROPERTY_LADDER } from "@/data/pricing-catalogue.generated";
import { cn } from "@/lib/utils";

/**
 * The property ladder, taken from the Pricing Calculator.
 *
 * Both the values and their order come from the workbook, so the site can
 * never offer a property type nobody has priced, and can never miss one that
 * has been. The short label is presentation only.
 */
export const PROPERTY_SIZES = PROPERTY_LADDER.map((value) => ({
  value,
  label: value.replace(/\bBedroom\b/, "Bed").replace(/^Studio Apartment$/, "Studio"),
}));

export type PropertySize = (typeof PROPERTY_LADDER)[number];

/** Second pricing axis on the whole-home packages. */
export const FURNISHING = FURNISHING_VALUES;
export type Furnishing = (typeof FURNISHING_VALUES)[number];

/** Apartments and villas are separated — nobody scans one list of thirteen. */
const APARTMENTS = PROPERTY_SIZES.filter((p) => !/Villa/.test(p.value));
const VILLAS = PROPERTY_SIZES.filter((p) => /Villa/.test(p.value));

function SizeGroup({
  heading,
  items,
  size,
  onSize,
}: {
  heading: string;
  items: typeof PROPERTY_SIZES;
  size: PropertySize | null;
  onSize: (v: PropertySize) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{heading}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((p) => (
          <button
            key={p.value}
            type="button"
            aria-pressed={size === p.value}
            onClick={() => onSize(p.value)}
            className={cn(
              "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-base)]",
              size === p.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:border-foreground/25 hover:bg-secondary",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function PropertySelector({
  size,
  furnishing,
  onSize,
  onFurnishing,
  showFurnishing = true,
}: {
  size: PropertySize | null;
  furnishing: Furnishing | null;
  onSize: (v: PropertySize) => void;
  onFurnishing: (v: Furnishing) => void;
  showFurnishing?: boolean;
}) {
  return (
    <div className="grid gap-8">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Property type
        </legend>
        <div className="mt-4 grid gap-5">
          <SizeGroup heading="Apartments" items={APARTMENTS} size={size} onSize={onSize} />
          <SizeGroup heading="Villas" items={VILLAS} size={size} onSize={onSize} />
        </div>
      </fieldset>

      {showFurnishing ? (
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Is it furnished?
          </legend>
          <div className="mt-4 flex flex-wrap gap-2">
            {FURNISHING.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={furnishing === f}
                onClick={() => onFurnishing(f)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-[var(--dur-base)]",
                  furnishing === f
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:border-foreground/25 hover:bg-secondary",
                )}
              >
                {furnishing === f ? <Check className="size-3.5" strokeWidth={3} /> : null}
                {f}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Furnished properties take longer — more surfaces, and furniture to work around.
          </p>
        </fieldset>
      ) : null}
    </div>
  );
}
