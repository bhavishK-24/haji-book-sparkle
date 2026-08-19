/**
 * The single source of truth for the Haji Ahli service catalogue.
 *
 * Pages and components must read services from here rather than declaring
 * their own copies. Data originates in the Service_Master workbook and is
 * transcribed mechanically into `service-catalogue.generated.ts`.
 */

export * from "./types";
export {
  ADD_ONS,
  ADD_ON_SUPPRESSES,
  SERVICES,
  SERVICE_CATEGORIES,
  PACKAGE_SCOPE,
  PACKAGE_SCOPE_COLUMNS,
} from "./service-catalogue.generated";

import {
  ADD_ONS,
  ADD_ON_SUPPRESSES,
  PACKAGE_SCOPE,
  PACKAGE_SCOPE_COLUMNS,
  SERVICES,
} from "./service-catalogue.generated";
import { isVideoQuoted } from "./configured/engine";
import { hasPerJobPricing } from "./pricing";
import type { AddOn, ScopeInclusion, Segment, Service } from "./types";

// ── lookups ───────────────────────────────────────────────────────────────

const BY_ID = new Map(SERVICES.map((s) => [s.id, s]));
const BY_SLUG = new Map(SERVICES.filter((s) => s.slug).map((s) => [s.slug!, s]));

export const getService = (id: string): Service | undefined => BY_ID.get(id);
export const getServiceBySlug = (slug: string): Service | undefined => BY_SLUG.get(slug);

// ── segment filters ───────────────────────────────────────────────────────

/** A service belongs to a segment if it targets that segment or both. */
export const servesSegment = (service: Service, segment: Exclude<Segment, "both">) =>
  service.segment === segment || service.segment === "both";

export const residentialServices = () => SERVICES.filter((s) => servesSegment(s, "residential"));

export const commercialServices = () => SERVICES.filter((s) => servesSegment(s, "commercial"));

// ── booking eligibility ───────────────────────────────────────────────────

/**
 * Whether the site may offer this service for online self-booking at all.
 *
 * The Service Master's booking type is the default, but a real price overrides
 * it. That sheet predates the Pricing Calculator, so services it still marks
 * "Quote Required" now have firm published prices — carpet shampooing being the
 * clearest case. Showing a customer a price and a "quoted on site" badge in the
 * same breath reads as a bait and switch, so a priced service is bookable.
 *
 * Inspection-required services stay enquiry-only whatever their prices say:
 * those need someone to look at the job before committing.
 */
export const isOnlineBookable = (service: Service) =>
  /*
   * Kitchen and bathroom deep cleans are quoted from a video on WhatsApp, so
   * they are never self-bookable however the Service Master classifies them.
   */
  !isVideoQuoted(service.id) &&
  (service.bookingType === "instant" ||
    service.bookingType === "scheduled" ||
    (service.bookingType === "quote-required" && hasPerJobPricing(service.id)));

/**
 * Whether tomorrow may be offered as a booking date.
 * Driven strictly by the workbook's `Website next day service` column.
 */
export const isNextDayEligible = (service: Service) =>
  service.nextDay === "available" && isOnlineBookable(service);

/** Services that must route to a quote or survey rather than the booking form. */
export const isEnquiryOnly = (service: Service) => !isOnlineBookable(service);

// ── pricing ───────────────────────────────────────────────────────────────

/** True when at least one variant carries a real price. */
export const hasPublishedPricing = (service: Service) =>
  service.variants.some((v) => v.price !== null);

export const pricedVariants = (service: Service) =>
  service.variants.filter((v) => v.price !== null);

/**
 * Lowest published price together with the unit it is charged in.
 *
 * The unit matters: SVC-108 has variants of 450 (up to 25 m²), 20 (26-100 m²
 * per m²) and 14 (101+ m² per m²). The bare minimum of 14 is a rate, not a
 * starting total, so rendering "from AED 14" would misstate the price.
 * Callers must show `unit` alongside `amount`, or use `startingTotal`.
 */
export const priceFrom = (service: Service): { amount: number; unit: string | null } | null => {
  const prices = service.variants.map((v) => v.price).filter((p): p is number => p !== null);
  if (!prices.length) return null;
  return { amount: Math.min(...prices), unit: service.pricingUnit };
};

/**
 * Lowest price that represents a complete job rather than a rate.
 * Null for tiered per-area services, where no such figure exists in the data.
 */
export const startingTotal = (service: Service): number | null => {
  if (service.pricingModel === "per-sqm") return null;
  const prices = service.variants.map((v) => v.price).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
};

// ── add-ons ───────────────────────────────────────────────────────────────

const ADD_ON_BY_ID = new Map(ADD_ONS.map((a) => [a.id, a]));

export const getAddOn = (id: string): AddOn | undefined => ADD_ON_BY_ID.get(id);

/**
 * Add-ons offerable against a service.
 *
 * Three gates, all from the workbook:
 *  1. the service lists the add-on in `Add_Ons`;
 *  2. the add-on lists the service in `Applicable_Parent_Services`;
 *  3. the add-on's `Website_Visibility` is Visible.
 *
 * Both directions of the relationship are required — a one-sided reference is
 * treated as a data error rather than an offer.
 */
export const addOnsForService = (service: Service): AddOn[] =>
  service.addOnIds
    .map((id) => ADD_ON_BY_ID.get(id))
    .filter((a): a is AddOn => Boolean(a))
    .filter((a) => a.visible && a.applicableTo.includes(service.id));

/**
 * Narrows the offer list against what the customer has already chosen.
 *
 * Kitchen Deep Cleaning contains the refrigerator and oven interiors, so once
 * it is selected those two must disappear — otherwise the customer pays twice
 * for work that is already in the basket.
 */
export const availableAddOns = (service: Service, selectedIds: string[]): AddOn[] => {
  const suppressed = new Set(selectedIds.flatMap((id) => ADD_ON_SUPPRESSES[id] ?? []));
  return addOnsForService(service).filter((a) => !suppressed.has(a.id));
};

/** Add-ons that a given selection has hidden, so the UI can explain why. */
export const suppressedBy = (selectedIds: string[]): Array<{ by: string; hides: AddOn[] }> =>
  selectedIds
    .filter((id) => ADD_ON_SUPPRESSES[id]?.length)
    .map((id) => ({
      by: ADD_ON_BY_ID.get(id)?.name ?? id,
      hides: (ADD_ON_SUPPRESSES[id] ?? [])
        .map((h) => ADD_ON_BY_ID.get(h))
        .filter((a): a is AddOn => Boolean(a)),
    }));

// ── package scope ─────────────────────────────────────────────────────────

/** Scope rows that are core to, or included in, a named package column. */
export const scopeForPackage = (packageName: string) =>
  PACKAGE_SCOPE.filter((row) => {
    const v = row.values[packageName];
    return v === "core" || v === "included";
  });

/** Scope rows offered as a paid add-on to a named package column. */
export const addOnScopeForPackage = (packageName: string) =>
  PACKAGE_SCOPE.filter((row) => row.values[packageName] === "addon");

/**
 * The whole-home packages, in ascending order of depth.
 *
 * Two tiers, not three — Light Cleaning is retired. The column still exists in
 * the workbook and therefore in PACKAGE_SCOPE, so it is excluded here rather
 * than deleted from the data.
 */
export const RESIDENTIAL_PACKAGE_COLUMNS = [
  "Residential Deep Cleaning",
  "Residential Intense Deep Cleaning",
] as const;

export type PackageComparisonRow = {
  item: string;
  group: string | null;
  values: Array<ScopeInclusion | undefined>;
};

/**
 * Package comparison limited to rows that actually differ.
 *
 * Deep and Intense share all but three of the 28 scope rows. Listing the
 * other 25 tells a customer nothing about which to choose and buries the
 * decision in a wall of identical ticks. Only rows where the columns disagree
 * are returned, so the table answers exactly one question: what do I get by
 * paying more?
 */
export const packageComparison = (
  columns: readonly string[] = RESIDENTIAL_PACKAGE_COLUMNS,
): PackageComparisonRow[] =>
  PACKAGE_SCOPE.map((row) => ({
    item: row.item,
    group: row.group,
    values: columns.map((c) => row.values[c]),
  })).filter((row) => new Set(row.values.map((v) => v ?? "none")).size > 1);

/**
 * What each package adds over the one below it.
 *
 * The raw `Whats_Included` prose for Intense is a single run-on sentence
 * restating the whole of Deep plus three more scopes — accurate, but useless
 * for choosing. This returns only the scope rows that this tier turns on and
 * the previous tier does not, which is the honest answer to "why pay more".
 *
 * The first column has no predecessor, so it returns its own core scope.
 */
export const packageAdds = (columns: readonly string[] = RESIDENTIAL_PACKAGE_COLUMNS): string[][] =>
  columns.map((col, i) => {
    const isOn = (v: ScopeInclusion | undefined) => v === "core" || v === "included";
    if (i === 0) {
      return PACKAGE_SCOPE.filter((r) => isOn(r.values[col])).map((r) => r.item);
    }
    const prev = columns[i - 1]!;
    return PACKAGE_SCOPE.filter((r) => isOn(r.values[col]) && !isOn(r.values[prev])).map(
      (r) => r.item,
    );
  });

/** Rows common to every package — shown once, as a shared baseline. */
export const packageCommonScope = (
  columns: readonly string[] = RESIDENTIAL_PACKAGE_COLUMNS,
): string[] =>
  PACKAGE_SCOPE.filter((row) => {
    const vals = columns.map((c) => row.values[c]);
    return vals.every((v) => v === "included" || v === "core");
  }).map((row) => row.item);

export { PACKAGE_SCOPE_COLUMNS as ALL_PACKAGE_COLUMNS };

// ── grouping ──────────────────────────────────────────────────────────────

export type CategoryGroup = { category: string; services: Service[] };

/** Services grouped by Parent_Category, each sorted by Display_Order. */
export const groupByCategory = (services: Service[] = SERVICES): CategoryGroup[] => {
  const map = new Map<string, Service[]>();
  for (const s of services) {
    const key = s.category ?? "Other";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return [...map.entries()].map(([category, list]) => ({
    category,
    services: list.sort((a, b) => (a.displayOrder ?? Infinity) - (b.displayOrder ?? Infinity)),
  }));
};

// ── known data gaps ───────────────────────────────────────────────────────

/**
 * Gaps in the source workbook that block features. Surfaced as data so the
 * findings survive in the codebase rather than only in a chat message.
 */
export const DATA_GAPS = {
  /**
   * The workbook has no man-hours, crew size or duration column anywhere.
   * Until the business supplies these, the duration engine cannot be built
   * without inventing the numbers.
   */
  duration: {
    blocks: "Estimated duration engine and duration-aware calendar availability",
    needed:
      "Typical on-site hours and crew size per service, per size variant (e.g. 2BR deep clean = N hours with a crew of M)",
  },
  /**
   * Services reference ADD-01…ADD-12 but the workbook contains no sheet
   * defining what those codes are, what they cost, or how long they take.
   */
  addOns: {
    blocks: "Add-on selection in the booking flow",
    needed: "An add-on definition table: code, name, description, price, duration impact",
    referencedCodes: [
      "ADD-01",
      "ADD-02",
      "ADD-03",
      "ADD-04",
      "ADD-05",
      "ADD-06",
      "ADD-07",
      "ADD-08",
      "ADD-09",
      "ADD-10",
      "ADD-11",
      "ADD-12",
    ],
  },
  /** 54 of 105 variants carry no price. */
  pricing: {
    blocks: "Any price display, quotes and payment",
    needed: "Prices for the 54 unpriced variants, or a decision to hide price entirely for now",
  },
} as const;
