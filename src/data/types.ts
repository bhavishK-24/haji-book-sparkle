/**
 * Service catalogue types.
 *
 * These describe the Haji Ahli service catalogue as defined in the
 * Service_Master workbook. Fields the workbook does not yet supply — price
 * on most variants, and service duration everywhere — are typed as nullable
 * rather than omitted, so they can be filled in later without any consumer
 * of this module changing shape.
 */

export type Segment = "residential" | "commercial" | "both";

/** Source column: `Website next day service`. */
export type NextDayEligibility =
  /** Customer may select tomorrow's date. */
  | "available"
  /** Lead time is set at quotation; next-day must not be offered online. */
  | "on-quote";

export type BookingType =
  "instant" | "scheduled" | "quote-required" | "inspection-required" | "subscription";

export type PricingModel =
  "fixed" | "per-unit" | "per-sqm" | "per-employee" | "custom-quote" | "subscription";

export type ServiceStatus = "active" | "draft-requires-pricing" | "draft-requires-definition";

export type ServicePriority = "core" | "supporting" | "development";

/**
 * How a scope item relates to a given package, from Package_Metrics.
 *
 * "medium" and "intense" are grades rather than yes/no answers — a row like
 * "Cleaning intensity" is present in both packages and differs in degree, so a
 * tick against both would say nothing. The comparison table renders these two
 * as words rather than as marks.
 */
export type ScopeInclusion = "core" | "included" | "excluded" | "addon" | "medium" | "intense";

export type PackageScopeRow = {
  item: string;
  group: string | null;
  /** Keyed by package display name (see PACKAGE_SCOPE_COLUMNS). */
  values: Partial<Record<string, ScopeInclusion>>;
};

export type PriceVariant = {
  id: string;
  label: string | null;
  /** e.g. "3 Bedroom Apartment", "5 Seater", "10,000 US gal / approx. 37,850 L". */
  attribute1: string | null;
  /** e.g. "Furnished", "Rooftop / Above-Ground". */
  attribute2: string | null;
  /**
   * AED, VAT-exclusive. `null` means the business has not set a price yet —
   * it does NOT mean free. Never render a null price as a number.
   */
  price: number | null;
  status: ServiceStatus;
};

/**
 * Estimated-duration rules.
 *
 * DELIBERATELY UNPOPULATED. The source workbook contains no man-hours, crew
 * size, or duration figures of any kind, so there is nothing to derive an
 * estimate from. This type exists so the booking engine can be built against
 * a stable shape once the business supplies the numbers.
 */
export type DurationRule = {
  /** Baseline minutes for the smallest variant of this service. */
  baseMinutes: number;
  /** Additional minutes keyed by variant attribute (e.g. bedroom count). */
  perVariantMinutes: Record<string, number>;
  /** Additional minutes per unit for per-unit services (seat, panel, tank). */
  perUnitMinutes: number | null;
  /** Crew size the above assumes; halving crew does not halve elapsed time. */
  assumedCrewSize: number;
  /** Range shown to the customer is ±this fraction of the point estimate. */
  toleranceFraction: number;
};

/** Quantity the booking flow must capture for a per-unit add-on. */
export type AddOnQuantityInput =
  "mattresses" | "seats" | "squareMetres" | "bathrooms" | "balconies" | "panels";

export type AddOn = {
  /** e.g. "ADD-03". */
  id: string;
  name: string;
  description: string | null;
  /** Parent service IDs this add-on may be offered against. */
  applicableTo: string[];
  pricingModel: PricingModel | null;
  pricingUnit: string | null;
  /** Null for flat add-ons that need no quantity from the customer. */
  quantityInput: AddOnQuantityInput | null;
  /** Set where the same work is also sold as a standalone service. */
  standaloneServiceId: string | null;
  /** Website_Visibility — false means never render, whatever else says. */
  visible: boolean;
  status: ServiceStatus;
  /** AED. Null until pricing is set. */
  price: number | null;
  /** Null until the business supplies duration metrics. */
  durationMinutes: number | null;
};

export type Service = {
  /** Stable business key, e.g. "SVC-102". */
  id: string;
  slug: string | null;
  name: string;
  shortDescription: string | null;
  /** Sanitised customer-facing scope bullets from Service_Def. */
  included: string[];
  excluded: string[];
  category: string | null;
  subcategory: string | null;
  segment: Segment | null;
  nextDay: NextDayEligibility | null;
  bookingType: BookingType | null;
  pricingModel: PricingModel | null;
  pricingUnit: string | null;
  priority: ServicePriority | null;
  displayOrder: number | null;
  status: ServiceStatus;
  /**
   * The Package_Metrics column describing this service's scope, or null when it
   * has none. Joined by id rather than by name so renaming a service for the
   * website cannot detach it from its own scope matrix.
   */
  scopeColumn: string | null;

  /** Licensing caveat that must be shown wherever the service is described. */
  licenceNote: string | null;

  suitablePropertyTypes: string[];
  serviceAreas: string[];
  bundleEligible: boolean;
  availableAsAddOn: boolean;
  /** Add-on IDs valid for this service; dangling references are dropped. */
  addOnIds: string[];
  crossSellIds: string[];
  certificateIssued: boolean;

  /** Null until the business supplies duration metrics. */
  duration: DurationRule | null;
  /**
   * Key into the photo manifest. Null where no photograph in the set honestly
   * shows this service being carried out — never filled with a near-miss.
   */
  media: string | null;

  variants: PriceVariant[];
};

/**
 * Booking record shape, defined now so payment can be added later without
 * restructuring. Price and payment fields are intentionally nullable.
 */
export type BookingDraft = {
  bookingId: string;
  customer: { name: string; phone: string; email: string | null };
  serviceId: string;
  variantId: string | null;
  addOnIds: string[];
  /** Minutes; derived from the duration engine once metrics exist. */
  estimatedMinutes: number | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  /** AED. Null while pricing is unset. */
  price: number | null;
  paymentStatus: "not-required" | "pending" | "paid" | null;
  bookingStatus: "new" | "confirmed" | "completed" | "cancelled";
};
