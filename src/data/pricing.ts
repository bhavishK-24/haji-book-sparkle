import {
  ADD_ON_PRICES,
  MANPOWER_PRICES,
  PROPERTY_PRICES,
  RATE_CARD,
  UNIT_PRICES,
} from "./pricing-catalogue.generated";
import {
  ADD_ON_DISCOUNTS,
  DEFAULT_MINIMUM_BOOKING_VALUE,
  INTENSE_UPGRADE,
  VIDEO_QUOTE_FROM,
  bedBugPrice,
  minimumBookingValueFor,
} from "./note-rules";
import type { PriceRow } from "./pricing-types";

/**
 * Price resolution.
 *
 * The Pricing Calculator workbook is the source of truth for money. A price is
 * either a figure the business entered or it is null — nothing here estimates,
 * averages or extrapolates, because a wrong price is worse than no price.
 *
 * VAT: every figure in the workbook is recorded VAT-EXCLUSIVE. UAE Federal Tax
 * Authority rules require prices advertised to consumers to be shown inclusive
 * of VAT, so the display helpers return the inclusive amount and keep the
 * exclusive figure alongside it for quotes, invoicing and B2B.
 */

/** UAE standard rate, from the workbook's own rate card. */
export const VAT_RATE = RATE_CARD.vatRate;

/**
 * Smallest job worth sending a crew for, in AED excluding VAT.
 *
 * Re-exported from the configurator engine so every price path applies the
 * same floor. See `MIN_BOOKING_VALUE` there for why it exists.
 */
export const MINIMUM_BOOKING_VALUE = DEFAULT_MINIMUM_BOOKING_VALUE;

export type ResolvedPrice = {
  /** As recorded in the workbook, exclusive of VAT. */
  exclusive: number;
  vat: number;
  /** What a consumer actually pays — the figure to advertise. */
  inclusive: number;
  currency: string;
  /** Which workbook row this came from, for audit and the booking record. */
  variantId: string;
  /**
   * True when the figure is the whole job. False for per-unit rates, where the
   * total depends on a quantity the customer supplies.
   */
  isTotal: boolean;
  /** e.g. "per m²", "per seat" — must be rendered next to a non-total price. */
  unitLabel: string | null;
  /** True when the minimum booking value lifted this price. */
  liftedToMinimum: boolean;
};

/** Why a price is unavailable, so the UI can say something true. */
export type UnavailableReason = "quote-only" | "not-priced";

const withVat = (
  exclusive: number,
  variantId: string,
  isTotal: boolean,
  unitLabel: string | null,
): ResolvedPrice => {
  const vat = Math.round(exclusive * VAT_RATE * 100) / 100;
  return {
    exclusive,
    vat,
    inclusive: Math.round((exclusive + vat) * 100) / 100,
    currency: "AED",
    variantId,
    isTotal,
    unitLabel,
    liftedToMinimum: false,
  };
};

/**
 * Applies the minimum booking value to a finished total.
 *
 * The floor belongs to the ORDER, not to each price on a list. Applying it per
 * row made every sofa size read AED 149 — a one-seater at 79, a two-seater at
 * 129 and a three-seater at 149 all lifted to the same number, which looked
 * like the price list was broken rather than like a minimum. Two one-seaters
 * clear the minimum between them, so the check has to happen once, at the end.
 *
 * `serviceId` selects a service-specific minimum where the workbook sets one —
 * sofa cleaning has its own, lower floor. See `note-rules.ts`.
 */
export function applyMinimumBookingValue(
  price: ResolvedPrice | null,
  serviceId?: string | null,
): ResolvedPrice | null {
  const floor = minimumBookingValueFor(serviceId);
  if (!price || !price.isTotal || price.exclusive >= floor) return price;
  const exclusive = floor;
  const vat = Math.round(exclusive * VAT_RATE * 100) / 100;
  return {
    ...price,
    exclusive,
    vat,
    inclusive: Math.round((exclusive + vat) * 100) / 100,
    liftedToMinimum: true,
  };
}

/** A stable id for a workbook row, for the booking record. */
const rowId = (r: PriceRow) =>
  [r.id, r.label, r.attribute].filter(Boolean).join("/").replace(/\s+/g, "-");

/** Turns "Per sq.m" into "per m²" and so on. Null when the row is a job total. */
function unitLabelOf(r: PriceRow): string | null {
  const u = r.unit ?? "";
  if (/per\s*sq\.?\s*m/i.test(u)) return "per m²";
  if (/per\s*seat/i.test(u)) return "per seat";
  if (/per\s*panel/i.test(u)) return "per panel";
  if (/per\s*month/i.test(u)) return "per month";
  return null;
}

// ── property-priced services ────────────────────────────────────────────────

const propertyIndex = new Map<string, PriceRow[]>();
for (const r of PROPERTY_PRICES) {
  const list = propertyIndex.get(r.id) ?? [];
  list.push(r);
  propertyIndex.set(r.id, list);
}

/** Every property type the business has priced for a service, in ladder order. */
export const propertyRowsFor = (serviceId: string): PriceRow[] =>
  propertyIndex.get(serviceId) ?? [];

/** Distinct property types, in the order the workbook lists them. */
export const PROPERTY_LADDER: string[] = [...new Set(PROPERTY_PRICES.map((r) => r.label))];

/**
 * The price for a property type, optionally narrowed by furnishing.
 *
 * Never falls back to a neighbouring row. If the business has not priced a
 * combination the customer is told it is confirmed by our team.
 */
export function resolvePropertyPrice(
  serviceId: string,
  propertyType: string,
  furnishing?: string | null,
): ResolvedPrice | null {
  const candidates = propertyRowsFor(serviceId).filter((r) => r.label === propertyType);
  if (candidates.length === 0) return null;

  const exact = furnishing ? candidates.find((r) => r.attribute === furnishing) : undefined;
  const chosen = exact ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (!chosen || chosen.priceExVat === null) return null;
  return withVat(chosen.priceExVat, rowId(chosen), true, null);
}

/** Whether a property row exists but was deliberately marked for quote. */
export function propertyNeedsQuote(
  serviceId: string,
  propertyType: string,
  furnishing?: string | null,
): boolean {
  const candidates = propertyRowsFor(serviceId).filter(
    (r) => r.label === propertyType && (!furnishing || r.attribute === furnishing || !r.attribute),
  );
  return candidates.length > 0 && candidates.every((r) => r.quoteOnly);
}

// ── unit-priced services ────────────────────────────────────────────────────

const unitIndex = new Map<string, PriceRow[]>();
for (const r of UNIT_PRICES) {
  const list = unitIndex.get(r.id) ?? [];
  list.push(r);
  unitIndex.set(r.id, list);
}

/** Every priced variant of a unit-priced service, e.g. every sofa size. */
export const unitRowsFor = (serviceId: string): PriceRow[] => unitIndex.get(serviceId) ?? [];

/** The price for a named variant, e.g. "3 Seater" or "1,000 gal - Rooftop". */
export function resolveUnitPrice(serviceId: string, variantLabel: string): ResolvedPrice | null {
  const row = unitRowsFor(serviceId).find((r) => r.label === variantLabel);
  if (!row || row.priceExVat === null) return null;
  return withVat(row.priceExVat, rowId(row), true, unitLabelOf(row));
}

/**
 * The total for a basket of pieces, e.g. two 3-seaters and a recliner.
 *
 * Lives here rather than in `item-selection.ts` so every caller gets the same
 * VAT treatment as any other price. The minimum booking value is deliberately
 * NOT applied — that belongs to the finished order, and `applyMinimumBookingValue`
 * is called once at the end.
 */
export function resolveItemsPrice(
  serviceId: string,
  items: Record<string, number>,
): ResolvedPrice | null {
  let exclusive = 0;
  const chosen: string[] = [];

  for (const row of unitRowsFor(serviceId)) {
    const qty = items[row.label] ?? 0;
    if (qty <= 0 || row.priceExVat === null) continue;
    exclusive += row.priceExVat * qty;
    chosen.push(`${row.label}×${qty}`);
  }

  if (chosen.length === 0) return null;
  return withVat(exclusive, `${serviceId}/${chosen.join("+")}`, true, null);
}

// ── add-ons ─────────────────────────────────────────────────────────────────

const addOnIndex = new Map<string, PriceRow[]>();
for (const r of ADD_ON_PRICES) {
  const list = addOnIndex.get(r.id) ?? [];
  list.push(r);
  addOnIndex.set(r.id, list);
}

export const addOnRowsFor = (addOnId: string): PriceRow[] => addOnIndex.get(addOnId) ?? [];

/**
 * The price of an add-on, optionally for a named size.
 *
 * Add-ons are priced as extras on a visit that is already happening, so the
 * minimum booking value does not apply to them.
 */
/**
 * Bed bug treatment, which the workbook prices per mattress.
 *
 * Lives here rather than in the generated rows because the sheet expresses it
 * as a sentence, not a table. See BED_BUG in `note-rules.ts`.
 */
export function resolveBedBugPrice(mattresses: number): ResolvedPrice | null {
  const amount = bedBugPrice(mattresses);
  if (amount === null) return null;
  return withVat(amount, `SVC-204/mattresses-${mattresses}`, true, null);
}

/**
 * An add-on priced as a discount on the standalone service.
 *
 * Sofa and carpet shampooing cost ten dirhams less as an add-on than booked on
 * their own, because the crew is already on site. Derived from the standalone
 * price so the two can never drift apart.
 */
export function resolveDiscountedAddOn(
  addOnId: string,
  variantLabel: string,
): ResolvedPrice | null {
  const rule = ADD_ON_DISCOUNTS[addOnId];
  if (!rule) return null;
  const base = resolveUnitPrice(rule.fromServiceId, variantLabel);
  if (!base) return null;
  return withVat(
    Math.max(base.exclusive - rule.discount, 0),
    `${addOnId}/${variantLabel}`,
    false,
    base.unitLabel,
  );
}

/**
 * The Intense upgrade, priced as the gap between the two whole-home tiers.
 *
 * The workbook says "whatever is the difference in the standard services", so
 * it is computed rather than stored — a customer must pay the same for Intense
 * however they arrive at it.
 */
export function resolveIntenseUpgrade(
  propertyType: string,
  furnishing?: string | null,
): ResolvedPrice | null {
  const deep = resolvePropertyPrice(INTENSE_UPGRADE.fromServiceId, propertyType, furnishing);
  const intense = resolvePropertyPrice(INTENSE_UPGRADE.toServiceId, propertyType, furnishing);
  if (!deep || !intense) return null;
  const gap = intense.exclusive - deep.exclusive;
  if (gap <= 0) return null;
  return withVat(gap, `${INTENSE_UPGRADE.addOnId}/${propertyType}`, false, null);
}

export function resolveAddOnPrice(
  addOnId: string,
  sizeLabel?: string | null,
): ResolvedPrice | null {
  const rows = addOnRowsFor(addOnId);
  const row = sizeLabel ? rows.find((r) => r.unit === sizeLabel) : rows[0];
  if (!row || row.priceExVat === null) return null;
  return withVat(row.priceExVat, rowId(row), false, unitLabelOf(row));
}

/** Sizes an add-on is priced for, e.g. mattress Single / Double / Queen / King. */
export const addOnSizesFor = (addOnId: string): string[] =>
  addOnRowsFor(addOnId)
    .filter((r) => r.priceExVat !== null && r.unit)
    .map((r) => r.unit as string);

// ── manpower ────────────────────────────────────────────────────────────────

export function resolveManpowerPrice(serviceId: string): ResolvedPrice | null {
  const row = MANPOWER_PRICES.find((r) => r.id === serviceId);
  if (!row || row.priceExVat === null) return null;
  return withVat(row.priceExVat, rowId(row), true, "per month");
}

// ── entry points ────────────────────────────────────────────────────────────

/**
 * Cheapest outcome of a room configurator.
 *
 * Kitchen and Bathroom have no rows on the pricing sheets — their prices come
 * from the customer's answers — but a service card still has to show an entry
 * price. Without this they read "quoted on confirmation" on the services page
 * despite being fully priced, which reads as evasive.
 *
 * The advertised floor comes from VIDEO_QUOTE_FROM, not from the band tables:
 * a video quote can price a small job below the smallest band the self-service
 * calculator could safely offer.
 */
const CONFIGURED_ENTRY_PRICE: Record<string, number> = VIDEO_QUOTE_FROM;

/**
 * Lowest price the business has entered for a service, for "from AED x".
 *
 * Considers every pricing sheet, because a service is priced on exactly one of
 * them and the caller should not have to know which.
 */
export function priceFrom(serviceId: string): ResolvedPrice | null {
  const configured = CONFIGURED_ENTRY_PRICE[serviceId];
  if (configured !== undefined) return withVat(configured, `${serviceId}/from`, true, null);

  const rows = [
    ...propertyRowsFor(serviceId),
    ...unitRowsFor(serviceId),
    ...MANPOWER_PRICES.filter((r) => r.id === serviceId),
  ].filter((r) => r.priceExVat !== null);
  if (rows.length === 0) return null;

  const cheapest = rows.reduce((a, b) =>
    (b.priceExVat as number) < (a.priceExVat as number) ? b : a,
  );
  return withVat(cheapest.priceExVat as number, rowId(cheapest), true, unitLabelOf(cheapest));
}

/** Highest price entered for a service, so a range can be shown. */
export function priceTo(serviceId: string): ResolvedPrice | null {
  const rows = [...propertyRowsFor(serviceId), ...unitRowsFor(serviceId)].filter(
    (r) => r.priceExVat !== null,
  );
  if (rows.length === 0) return null;
  const dearest = rows.reduce((a, b) =>
    (b.priceExVat as number) > (a.priceExVat as number) ? b : a,
  );
  return withVat(dearest.priceExVat as number, rowId(dearest), true, unitLabelOf(dearest));
}

/** True when the business has entered at least one real price for a service. */
export const hasPricing = (serviceId: string): boolean => priceFrom(serviceId) !== null;

/**
 * True when a service is priced per job, so a customer could actually book one.
 *
 * Deliberately excludes manpower supply. Those rows carry a monthly figure, but
 * a staff contract is negotiated and signed, not added to a basket — treating
 * "has a price" as "is bookable" put Office Boy, Cleaner and Watchman Supply
 * behind a Book now button at AED 3,799 a month.
 */
export const hasPerJobPricing = (serviceId: string): boolean =>
  [...propertyRowsFor(serviceId), ...unitRowsFor(serviceId)].some((r) => r.priceExVat !== null) ||
  CONFIGURED_ENTRY_PRICE[serviceId] !== undefined;

/** True when every row for a service is explicitly marked for quote. */
export function isQuoteOnly(serviceId: string): boolean {
  const rows = [
    ...propertyRowsFor(serviceId),
    ...unitRowsFor(serviceId),
    ...MANPOWER_PRICES.filter((r) => r.id === serviceId),
  ];
  return (
    rows.length > 0 && rows.every((r) => r.priceExVat === null) && rows.some((r) => r.quoteOnly)
  );
}

/** "AED 315" — no decimals when the amount is whole, which it usually is. */
export function formatAed(amount: number): string {
  const whole = Number.isInteger(amount);
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
