/**
 * Room configurators: services priced from measurable facts about the room
 * rather than from a Small / Medium / Large table the customer has to
 * interpret.
 *
 * Two principles run through this module.
 *
 * The customer is only ever asked things they can *observe* — how many cabinet
 * doors, whether there is a bathtub, when the oven was last cleaned. They are
 * never asked to grade their own dirt, because self-reported severity is
 * unreliable in one direction: everybody under-reports.
 *
 * And nothing internal leaks. "Band C" and "door count 33" exist only in this
 * module; the customer sees a photograph, a caption, and one price in AED.
 */

/** A choice the customer can make, presented as a card. */
export type ChoiceOption = {
  id: string;
  /** What the customer reads on the card. */
  label: string;
  /** The caption under the label — the observable detail that makes it pickable. */
  caption: string | null;
  /**
   * Key into the photo manifest in `src/data/media.ts`.
   *
   * Null until a real reference photograph is supplied. A card with no image
   * renders as clean text rather than a placeholder: a stock photo of someone
   * else's kitchen would be worse than no photo, because the customer would be
   * matching their room against a picture that does not represent our work.
   */
  image: string | null;
};

/** One question in a configurator, and how to render it. */
export type ChoiceQuestion = {
  id: string;
  /** Phrased as the customer would ask it. */
  question: string;
  /** Supporting line under the question. */
  help: string | null;
  /** How the answer is collected. */
  kind: "single" | "multiple" | "count";
  options: ChoiceOption[];
  /** For "count": inclusive bounds of the stepper. */
  min?: number;
  max?: number;
  /** For "count": what a single unit is called, e.g. "bathroom". */
  unitNoun?: string;
};

// ── kitchen ─────────────────────────────────────────────────────────────────

/**
 * Cabinet-door bands.
 *
 * Asking "how many cabinet doors and drawer fronts?" and letting the customer
 * match a photograph is far more reliable than asking them to count, and far
 * more reliable still than asking them to judge their kitchen's size in m².
 */
export type DoorBand = "A" | "B" | "C" | "D";

/**
 * When the oven and extractor hood were last professionally cleaned.
 *
 * This is the buildup proxy. It is a verifiable fact about the past rather
 * than an opinion about the present, which is why it predicts labour better
 * than asking how greasy the kitchen is.
 */
export type CleanRecency = "never" | "over-12-months" | "6-12-months" | "under-6-months";

export type KitchenSelection = {
  doorBand: DoorBand | null;
  /** Option ids from the appliance question. */
  appliances: string[];
  lastCleaned: CleanRecency | null;
};

// ── bathroom ────────────────────────────────────────────────────────────────

/**
 * How much limescale is on the glass and taps.
 *
 * "not-sure" is a first-class answer, not a failure to answer: the customer is
 * priced at the standard tier and told plainly what happens if the crew finds
 * worse. Forcing a guess here would just produce a wrong guess.
 */
export type ScaleLevel = "none" | "light" | "moderate" | "heavy" | "not-sure";

export type BathroomSelection = {
  /** How many bathrooms need doing. */
  bathrooms: number | null;
  bathtubs: number;
  glassEnclosures: number;
  scale: ScaleLevel | null;
};

// ── outcome ─────────────────────────────────────────────────────────────────

/**
 * The result of pricing a configured room.
 *
 * Three states, kept distinct on purpose. "The customer has not finished
 * answering" is not the same as "this job has to be seen first", and neither
 * may ever be flattened into a number.
 */
export type ConfiguredOutcome =
  | {
      kind: "priced";
      /** AED, exclusive of VAT — the figure the business entered. */
      exclusive: number;
      /** What the customer pays, VAT included. */
      inclusive: number;
      vat: number;
      /** True when the minimum booking value lifted this price. */
      liftedToMinimum: boolean;
      /**
       * Plain-language lines explaining what makes up the price.
       *
       * Deliberately describes the *work*, never the internal band or the
       * door count: "Kitchen deep clean", "2 bathtubs", not "Band B".
       */
      lines: Array<{ label: string; amount: number }>;
    }
  | { kind: "needs-input"; unanswered: string[] }
  | { kind: "quote"; reason: string };
