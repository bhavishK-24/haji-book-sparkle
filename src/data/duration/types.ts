/**
 * Duration and crew estimation.
 *
 * The Service_Master workbook contains no duration or crew figures of any
 * kind — every `Est_Additional_Duration` cell reads "Requires Business
 * Decision". This module therefore models the *shape* of the calculation and
 * makes every unknown explicit, so the engine can be built and tested now and
 * the numbers dropped in later without touching any consumer.
 *
 * Nothing here invents a figure. A value is either supplied by the business
 * or it is `Tbd`, and the type system will not let you read one as the other.
 */

/** Minutes of elapsed on-site time (not man-minutes). */
export type Minutes = number;

/**
 * A value the business has not supplied yet.
 *
 * Modelled as a discriminated union rather than `null` so that reading it
 * without checking is a type error — that is what stops a placeholder ever
 * being rendered to a customer as a real estimate.
 */
export type Tbd = { status: "tbd"; needs: string };
export type Known<T> = { status: "set"; value: T };
export type Maybe<T> = Known<T> | Tbd;

export const tbd = (needs: string): Tbd => ({ status: "tbd", needs });
export const known = <T>(value: T): Known<T> => ({ status: "set", value });
export const isKnown = <T>(m: Maybe<T>): m is Known<T> => m.status === "set";

/** How a service's duration scales with what the customer tells us. */
export type DurationBasis =
  /** Whole-property job; duration keyed by property size. e.g. deep cleaning. */
  | "per-property"
  /** Duration scales with a countable quantity. e.g. seats, mattresses, panels. */
  | "per-unit"
  /** Duration scales with an area in m². e.g. carpet. */
  | "per-area"
  /** Same duration regardless of inputs. e.g. a single-room reset. */
  | "flat";

/** What the customer must tell us before an estimate is possible. */
export type DurationDriver =
  | "propertySize"
  | "furnishing"
  | "bedrooms"
  | "bathrooms"
  | "balconies"
  | "seats"
  | "mattresses"
  | "panels"
  | "squareMetres"
  | "tankSize"
  | "tankLocation"
  | "condition"
  | "none";

/** Crew size in people. */
export type Crew = number;

/**
 * One service's duration model.
 *
 * `perDriverMinutes` is keyed by the *exact* attribute strings that appear in
 * Variant_Pricing, so the estimate joins cleanly onto what the customer
 * already chose in the booking flow.
 */
export type DurationModel = {
  serviceId: string;
  serviceName: string;
  basis: DurationBasis;
  /** The main thing duration scales with. */
  primaryDriver: DurationDriver;
  /** A second axis, where one exists (furnishing, tank location). */
  secondaryDriver: DurationDriver | null;

  /** People on site for a typical job of this type. */
  baseCrew: Maybe<Crew>;
  /** Elapsed minutes for the smallest job, before any driver adjustment. */
  baseMinutes: Maybe<Minutes>;
  /** Never quote below this, whatever the maths says. */
  minMinutes: Maybe<Minutes>;
  /** Above this, the job needs a survey rather than an online booking. */
  maxMinutes: Maybe<Minutes>;

  /**
   * Elapsed minutes per value of the primary driver.
   * Keys are the real Variant_Attribute_1 values.
   */
  perDriverMinutes: Record<string, Maybe<Minutes>>;

  /**
   * Crew per value of the primary driver.
   *
   * Crew is not constant across sizes — a studio deep clean is 2 cleaners and
   * a 6-bedroom villa is 6. Modelling crew as a single number would have made
   * every large job unstaffable on paper.
   */
  perDriverCrew: Record<string, Maybe<Crew>>;

  /**
   * Multiplier applied for the secondary driver, e.g. furnished properties
   * take longer. 1.0 means no effect.
   */
  secondaryMultiplier: Record<string, Maybe<number>>;

  /** Extra minutes per additional unit, for per-unit and per-area services. */
  perUnitMinutes: Maybe<Minutes>;

  /**
   * The estimate is shown as a range of ±this fraction. 0.15 renders a
   * 4-hour estimate as "3.5–4.5 hours".
   */
  toleranceFraction: Maybe<number>;
};

/** How much an add-on adds to the visit. */
export type AddOnDurationModel = {
  addOnId: string;
  addOnName: string;
  /** Whether the add-on's time scales with a quantity. */
  scalesWith: DurationDriver;
  /** Flat minutes added when selected. */
  flatMinutes: Maybe<Minutes>;
  /** Additional minutes per unit, where it scales. */
  perUnitMinutes: Maybe<Minutes>;
  /** Some add-ons need another person rather than more time. */
  extraCrew: Maybe<Crew>;
};

/** Result of an estimate attempt. */
export type EstimateResult =
  | {
      ok: true;
      /** Point estimate in elapsed minutes. */
      minutes: Minutes;
      /**
       * True when the job is longer than the business will accept as an online
       * booking. The estimate is still returned in full — the caller decides
       * to route it to a site survey rather than the calendar.
       */
      exceedsOnlineBooking: boolean;
      /** Rendered range, e.g. { lowMinutes: 210, highMinutes: 270 }. */
      lowMinutes: Minutes;
      highMinutes: Minutes;
      crew: Crew;
      /** Human-readable breakdown, for the "why this long?" disclosure. */
      breakdown: Array<{ label: string; minutes: Minutes }>;
    }
  | {
      ok: false;
      /** Exactly which figures are missing, for the ops team. */
      missing: string[];
    };
