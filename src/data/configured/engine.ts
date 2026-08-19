import { VAT_RATE } from "../pricing";
import {
  BATHROOM_PRICING,
  BATHROOM_QUESTIONS,
  MAX_BATHROOMS_ONLINE,
  chargesScaleSurcharge,
} from "./bathroom";
import { KITCHEN_QUESTIONS, NO_APPLIANCES, resolveBand } from "./kitchen";
import type {
  BathroomSelection,
  ConfiguredOutcome,
  DoorBand,
  KitchenSelection,
  ScaleLevel,
} from "./types";

export * from "./types";
export * from "./kitchen";
export * from "./bathroom";
export { KITCHEN_QUESTIONS, BATHROOM_QUESTIONS };

/**
 * Smallest job the business will send a crew out for, in AED excluding VAT.
 *
 * Applied as a floor after everything else. A single small item can price below
 * the cost of getting a van to the address, and quoting that figure would mean
 * losing money on every such booking.
 */
export const MIN_BOOKING_VALUE = 149;

/**
 * Services quoted from a short video on WhatsApp rather than booked online.
 *
 * Kitchen and bathroom deep cleans vary more than any set of questions can
 * capture: the same "standard bathroom" is a wipe-down or an afternoon of
 * descaling, and asking a customer to grade their own limescale produces an
 * answer that is wrong in a predictable direction. Twenty seconds of video
 * settles it, and lets us give a price that does not move on the day.
 *
 * The band and formula logic in `kitchen.ts` and `bathroom.ts` is retained —
 * it is the business's real price list and the coordinator quotes from it.
 * It is simply no longer asked of the customer.
 */
export const VIDEO_QUOTE_SERVICE_IDS = ["SVC-104", "SVC-105"] as const;
export const isVideoQuoted = (serviceId: string): boolean =>
  (VIDEO_QUOTE_SERVICE_IDS as readonly string[]).includes(serviceId);

/**
 * Formerly "does this service use an on-site configurator".
 *
 * Kept as an alias so nothing has to change if these services ever move back
 * to self-service pricing — the answer to "is this priced by room detail" is
 * still yes, it is just answered by a coordinator watching a video.
 */
export const CONFIGURED_SERVICE_IDS = VIDEO_QUOTE_SERVICE_IDS;
export const isConfigured = isVideoQuoted;

/** Wraps a VAT-exclusive total into the shape the UI renders. */
function settle(
  lines: Array<{ label: string; amount: number }>,
  raw: number,
): Extract<ConfiguredOutcome, { kind: "priced" }> {
  const liftedToMinimum = raw < MIN_BOOKING_VALUE;
  const exclusive = liftedToMinimum ? MIN_BOOKING_VALUE : raw;
  const vat = Math.round(exclusive * VAT_RATE * 100) / 100;
  return {
    kind: "priced",
    exclusive,
    vat,
    inclusive: Math.round((exclusive + vat) * 100) / 100,
    liftedToMinimum,
    lines,
  };
}

// ── kitchen ─────────────────────────────────────────────────────────────────

/** How many appliance interiors were actually selected. */
export const applianceCount = (appliances: string[]): number =>
  appliances.filter((a) => a !== NO_APPLIANCES).length;

export function priceKitchen(selection: KitchenSelection): ConfiguredOutcome {
  const unanswered: string[] = [];
  if (!selection.doorBand) unanswered.push(KITCHEN_QUESTIONS[0]!.question);
  /*
   * An empty appliance list is genuinely unanswered — "none" is a real choice
   * the customer has to make, because it changes the band.
   */
  if (selection.appliances.length === 0) unanswered.push(KITCHEN_QUESTIONS[1]!.question);
  if (!selection.lastCleaned) unanswered.push(KITCHEN_QUESTIONS[2]!.question);
  if (unanswered.length > 0) return { kind: "needs-input", unanswered };

  const result = resolveBand(
    selection.doorBand as DoorBand,
    applianceCount(selection.appliances),
    selection.lastCleaned!,
  );
  if (result.kind === "quote") return { kind: "quote", reason: result.reason };

  return settle([{ label: "Kitchen deep clean", amount: result.price }], result.price);
}

// ── bathroom ────────────────────────────────────────────────────────────────

export function priceBathroom(selection: BathroomSelection): ConfiguredOutcome {
  const unanswered: string[] = [];
  if (!selection.bathrooms) unanswered.push(BATHROOM_QUESTIONS[0]!.question);
  if (!selection.scale) unanswered.push(BATHROOM_QUESTIONS[3]!.question);
  if (unanswered.length > 0) return { kind: "needs-input", unanswered };

  const n = selection.bathrooms as number;
  if (n > MAX_BATHROOMS_ONLINE) {
    return {
      kind: "quote",
      reason: `For ${MAX_BATHROOMS_ONLINE + 1} bathrooms or more we quote after a quick site check.`,
    };
  }

  const p = BATHROOM_PRICING;
  const lines: Array<{ label: string; amount: number }> = [
    { label: n === 1 ? "Bathroom deep clean" : "First bathroom", amount: p.firstBathroom },
  ];

  if (n > 1) {
    lines.push({
      label: `${n - 1} additional bathroom${n - 1 === 1 ? "" : "s"}`,
      amount: p.additionalBathroom * (n - 1),
    });
  }

  /* Counts cannot exceed the number of bathrooms being cleaned. */
  const bathtubs = Math.min(Math.max(selection.bathtubs, 0), n);
  const enclosures = Math.min(Math.max(selection.glassEnclosures, 0), n);

  if (bathtubs > 0) {
    lines.push({
      label: `${bathtubs} bathtub${bathtubs === 1 ? "" : "s"}`,
      amount: p.perBathtub * bathtubs,
    });
  }
  if (enclosures > 0) {
    lines.push({
      label: `${enclosures} glass shower enclosure${enclosures === 1 ? "" : "s"}`,
      amount: p.perGlassEnclosure * enclosures,
    });
  }
  if (chargesScaleSurcharge(selection.scale as ScaleLevel)) {
    lines.push({
      label: "Heavy limescale removal",
      amount: p.perBathroomHeavyScale * n,
    });
  }

  return settle(
    lines,
    lines.reduce((sum, l) => sum + l.amount, 0),
  );
}

/** Prices whichever configurator the service uses. */
export function priceConfigured(
  serviceId: string,
  selection: KitchenSelection | BathroomSelection,
): ConfiguredOutcome {
  if (serviceId === "SVC-104") return priceKitchen(selection as KitchenSelection);
  if (serviceId === "SVC-105") return priceBathroom(selection as BathroomSelection);
  return { kind: "quote", reason: "This service is quoted by our team." };
}

export const emptyKitchenSelection = (): KitchenSelection => ({
  doorBand: null,
  appliances: [],
  lastCleaned: null,
});

export const emptyBathroomSelection = (): BathroomSelection => ({
  bathrooms: 1,
  bathtubs: 0,
  glassEnclosures: 0,
  scale: null,
});
