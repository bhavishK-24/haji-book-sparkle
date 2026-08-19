/**
 * Shapes for the Pricing Calculator import.
 *
 * Kept separate from `types.ts` (the Service Master shapes) because money and
 * scope come from two different workbooks with two different owners.
 */

/**
 * The business's cost-up rate card, from the Inputs sheet.
 *
 * Every price in the calculator is derived from these seven numbers, so any
 * price this codebase computes for itself must use the same ones — otherwise
 * the site and the spreadsheet drift apart the first time a rate changes.
 */
export type RateCard = {
  /** All-in cost of one worker for one hour, in AED. */
  labourCostPerPersonHour: number;
  /** Office, admin, supervision and marketing, as a fraction of direct cost. */
  overheadRate: number;
  /** Target margin on the sale, as a fraction of the selling price. */
  targetGrossMargin: number;
  /** Chemicals and consumables per job, in AED. */
  defaultMaterialsPerJob: number;
  /** Vehicle, fuel and travel per visit, in AED. */
  defaultTransportPerVisit: number;
  /** UAE standard rate, as a fraction. */
  vatRate: number;
  /** Prices are tidied to this multiple before VAT is added. */
  roundToNearest: number;
};

/**
 * One priced row of the calculator.
 *
 * A row with `priceExVat: null` is not free and is not an error — the business
 * has either not set that price yet, or has deliberately marked it for quote.
 * `note` and `quoteOnly` say which.
 */
export type PriceRow = {
  /** Service id, or add-on id on the add-on sheet. */
  id: string;
  /** Property type, variant name, or role — whatever that sheet keys on. */
  label: string;
  /** Second axis where one exists: "Furnished" / "Unfurnished". */
  attribute: string | null;
  /** "Per kitchen", "Per sq.m", "Per month" — as the business wrote it. */
  unit: string | null;
  /** How many units the row's price covers, for per-unit rows. */
  unitsCovered: number | null;
  /** AED, exclusive of VAT. Null when not priced. */
  priceExVat: number | null;
  /** AED per single unit, where the sheet computed one. */
  pricePerUnit: number | null;
  /** People on site, where the business costed the row from crew and hours. */
  crew: number | null;
  /** Elapsed hours on site, from the same costing. */
  hours: number | null;
  /** What the business typed instead of a price, e.g. "As per site visit". */
  note: string | null;
  /** True when that note means "do not show an online price". */
  quoteOnly: boolean;
  /** Set when the row was copied from another service on the sheet's instruction. */
  aliasOf: string | null;
};
