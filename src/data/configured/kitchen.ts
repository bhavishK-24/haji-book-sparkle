// ─────────────────────────────────────────────────────────────────────────────
//  KITCHEN INTENSE DEEP CLEANING — SVC-104
//
//  HAND-MAINTAINED. Prices and band rules supplied by the business.
//  Everything a price depends on is in this file.
// ─────────────────────────────────────────────────────────────────────────────

import type { ChoiceQuestion, CleanRecency, DoorBand } from "./types";

/** What each band sells for, in AED, exclusive of VAT. */
export const BAND_PRICE: Record<Exclude<DoorBand, "D">, number> = {
  A: 349,
  B: 449,
  C: 599,
};

/**
 * Cabinet doors and drawer fronts.
 *
 * The internal midpoint is recorded for each band because it is the number the
 * business reasons about when reviewing pricing. It never reaches the customer,
 * who sees only the photograph and the range in the caption.
 */
export const DOOR_BANDS: Array<{ band: DoorBand; internalCount: number }> = [
  { band: "A", internalCount: 12 },
  { band: "B", internalCount: 20 },
  { band: "C", internalCount: 33 },
  { band: "D", internalCount: 45 },
];

/**
 * Appliance interiors the customer can add.
 *
 * The oven and refrigerator are also sold as standalone add-ons (ADD-02 and
 * ADD-01) against the whole-home packages. Here they are part of the kitchen
 * band rather than separately charged — the band price already covers the
 * appliance work, and the *number* selected is what moves the band.
 */
export const APPLIANCE_OPTIONS = [
  { id: "oven", label: "Oven", caption: "Racks, door glass and interior, degreased" },
  { id: "hood", label: "Extractor hood", caption: "Hood, filters and visible ducting" },
  { id: "fridge", label: "Fridge / freezer", caption: "Shelves, drawers, seals and surfaces" },
  { id: "microwave", label: "Microwave", caption: "Interior, turntable and door" },
  { id: "dishwasher", label: "Dishwasher", caption: "Filter, seals and interior" },
  { id: "washing-machine", label: "Washing machine", caption: "Drum, seals and detergent drawer" },
] as const;

/** Selecting this clears the rest — it is not an appliance, it is "none of them". */
export const NO_APPLIANCES = "none";

// ── questions ───────────────────────────────────────────────────────────────

export const KITCHEN_QUESTIONS: ChoiceQuestion[] = [
  {
    id: "doors",
    question: "How many cabinet doors and drawer fronts does your kitchen have?",
    help: "Match your kitchen to the closest picture — no need to count exactly.",
    kind: "single",
    options: [
      {
        id: "A",
        label: "Compact / galley",
        caption: "Around 10–14 doors and drawers",
        image: null,
      },
      {
        id: "B",
        label: "Standard",
        caption: "Around 15–25 doors and drawers",
        image: null,
      },
      {
        id: "C",
        label: "Large or L-shaped",
        caption: "Around 26–40 doors and drawers",
        image: null,
      },
      {
        id: "D",
        label: "Very large, island or double-height",
        caption: "More than 40 doors and drawers",
        image: null,
      },
    ],
  },
  {
    id: "appliances",
    question: "Which appliances should we clean inside?",
    help: "Exteriors are always included. Select any interiors you want done.",
    kind: "multiple",
    options: [
      ...APPLIANCE_OPTIONS.map((a) => ({
        id: a.id,
        label: a.label,
        caption: a.caption,
        image: null,
      })),
      { id: NO_APPLIANCES, label: "None of these", caption: null, image: null },
    ],
  },
  {
    id: "lastCleaned",
    question: "When were the oven and extractor hood last professionally cleaned?",
    help: "This tells us how much baked-on grease to expect, so we book the right time.",
    kind: "single",
    options: [
      { id: "never", label: "Never", caption: null, image: null },
      { id: "over-12-months", label: "More than 12 months ago", caption: null, image: null },
      { id: "6-12-months", label: "6–12 months ago", caption: null, image: null },
      { id: "under-6-months", label: "Less than 6 months ago", caption: null, image: null },
    ],
  },
];

// ── band resolution ─────────────────────────────────────────────────────────

/** Grease has had time to build up. */
const NEGLECTED: CleanRecency[] = ["never", "over-12-months"];
const isNeglected = (r: CleanRecency) => NEGLECTED.includes(r);

export type BandResult =
  { kind: "band"; band: Exclude<DoorBand, "D">; price: number } | { kind: "quote"; reason: string };

/**
 * Resolves the customer's three answers to a band, or to a site visit.
 *
 * Written as an ordered rule list rather than a formula because that is how the
 * business supplied it, and because a formula would imply relationships between
 * the three inputs that were never stated.
 *
 * FIRST MATCH WINS. Anything no rule covers goes to a site visit — never to a
 * nearby band. Two combinations currently fall through, both involving a
 * compact kitchen with a lot of appliance work; they are listed in
 * `UNCOVERED_COMBINATIONS` below so they can be priced when the business is
 * ready. Guessing them would be indistinguishable from a real price once it
 * reached a customer.
 */
export function resolveBand(
  doorBand: DoorBand,
  applianceCount: number,
  lastCleaned: CleanRecency,
): BandResult {
  const band = (b: Exclude<DoorBand, "D">): BandResult => ({
    kind: "band",
    band: b,
    price: BAND_PRICE[b],
  });

  /* A very large kitchen is always seen before it is priced. */
  if (doorBand === "D") {
    return {
      kind: "quote",
      reason:
        "Kitchens this size vary too much to price sight-unseen. Send us two photos and we will confirm a fixed price.",
    };
  }

  /* A compact kitchen with little appliance work. */
  if (doorBand === "A" && applianceCount <= 2) return band("A");

  /* A compact kitchen with a real appliance load, but recently cleaned. */
  if (doorBand === "A" && applianceCount <= 4 && !isNeglected(lastCleaned)) return band("B");

  /*
   * A standard kitchen. Recently cleaned it prices at its own band; left for
   * over a year the grease load pushes it to the band above.
   */
  if (doorBand === "B") return band(isNeglected(lastCleaned) ? "C" : "B");

  /* A large or L-shaped kitchen, whatever the condition. */
  if (doorBand === "C") return band("C");

  return {
    kind: "quote",
    reason:
      "This combination needs a quick look first. Send us two photos and we will confirm a fixed price.",
  };
}

/**
 * Combinations `resolveBand` deliberately sends to a site visit because no
 * rule covers them. Surfaced so the gap is visible rather than discovered by a
 * customer.
 */
export const UNCOVERED_COMBINATIONS = [
  "Compact kitchen (10–14 doors), 3–4 appliances, never cleaned or over 12 months ago",
  "Compact kitchen (10–14 doors), 5 or more appliances, any condition",
];

/**
 * The offer that turns a self-reported condition into evidence.
 *
 * Two photographs cost the customer nothing and remove the single largest
 * source of on-site re-quoting, so they are worth a firm price commitment.
 */
export const PHOTO_LOCK_OFFER = {
  ask: "Send us two photos — one of the hob and one of an open cabinet",
  reward: "and we will lock this price in writing, with no on-site adjustment.",
};
