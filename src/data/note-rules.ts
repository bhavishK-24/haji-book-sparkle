// ─────────────────────────────────────────────────────────────────────────────
//  PRICING NOTES FROM THE WORKBOOK
//
//  HAND-MAINTAINED, and deliberately so.
//
//  Some prices in the Pricing Calculator are written as a sentence rather than
//  a number — "First Mattress 180, additional mattress 100 each", "MIN AOV of
//  129 for this service", "Same price 10 dhs lower". Those notes ARE the price
//  for those services; the price column is blank precisely because a single
//  figure could not express them.
//
//  The importer cannot read a sentence, so each one is transcribed here, with
//  the exact wording it came from quoted above it. If a note changes in the
//  workbook, change it here too — nothing else reads them.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Smallest order the business will send a crew for, in AED excluding VAT.
 *
 * 149 is the general floor. Sofa cleaning carries its own, lower one because
 * the sheet says so — a service-specific minimum always wins over the general
 * one, otherwise the note would have no effect.
 */
export const DEFAULT_MINIMUM_BOOKING_VALUE = 149;

/** Sheet: Unit_Pricing, SVC-107 — "MIN AOV of 129 for this service". */
const MINIMUM_BY_SERVICE: Record<string, number> = {
  "SVC-107": 129,
};

export const minimumBookingValueFor = (serviceId: string | null | undefined): number =>
  (serviceId ? MINIMUM_BY_SERVICE[serviceId] : undefined) ?? DEFAULT_MINIMUM_BOOKING_VALUE;

/**
 * Bed bug treatment is priced per mattress, not per property.
 *
 * Sheet: Property_Pricing, SVC-204 —
 *   "First Mattress 180, additional mattress 100 each"
 *
 * This is the only service on the property sheet that does not price by
 * property type, which is why its whole property table is blank. Treating that
 * blank as "unpriced" hid a service that is in fact fully priced.
 */
export const BED_BUG = {
  serviceId: "SVC-204",
  firstMattress: 180,
  additionalMattress: 100,
  /** Above this, the office quotes rather than the site. */
  maxMattressesOnline: 10,
};

export function bedBugPrice(mattresses: number): number | null {
  if (!Number.isInteger(mattresses) || mattresses < 1) return null;
  if (mattresses > BED_BUG.maxMattressesOnline) return null;
  return BED_BUG.firstMattress + BED_BUG.additionalMattress * (mattresses - 1);
}

/**
 * Add-ons priced as a discount on the standalone service.
 *
 * Sheet: Add_Ons, ADD-04 and ADD-05 — "Same price 10 dhs lower", with the
 * price column reading "10 dhs discounted from original price".
 *
 * The discount exists because the crew is already on site: there is no second
 * call-out, so the customer keeps the difference.
 */
export const ADD_ON_DISCOUNTS: Record<string, { fromServiceId: string; discount: number }> = {
  "ADD-04": { fromServiceId: "SVC-107", discount: 10 }, // Sofa shampooing
  "ADD-05": { fromServiceId: "SVC-108", discount: 10 }, // Carpet shampooing
};

/**
 * Advertised entry prices for the services quoted from a video.
 *
 * AED, exclusive of VAT, supplied by the business.
 *
 * These are lower than the smallest band in `kitchen.ts` (349) and the
 * single-bathroom price in `bathroom.ts` (299), and deliberately so: quoting
 * from a video lets a genuinely small job be priced below the smallest band the
 * self-service calculator could safely offer. The band tables remain the
 * coordinator's reference for everything above that floor.
 */
export const VIDEO_QUOTE_FROM: Record<string, number> = {
  "SVC-104": 200, // Kitchen Intense Deep Cleaning
  "SVC-105": 170, // Bathroom Intense Deep Cleaning
};

/**
 * The Intense upgrade add-on.
 *
 * Sheet: Add_Ons, ADD-06 — "Wtv is the difference in the standard services".
 *
 * Priced as exactly what it says: the gap between Deep and Intense for the
 * customer's own property. Charging anything else would mean a customer could
 * pay a different amount for Intense depending on which route they took to it.
 */
export const INTENSE_UPGRADE = {
  addOnId: "ADD-06",
  fromServiceId: "SVC-102",
  toServiceId: "SVC-103",
};
