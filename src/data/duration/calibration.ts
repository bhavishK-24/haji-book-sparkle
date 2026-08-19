// Operational duration and crew figures, supplied by Haji Ahli.
//
// HAND-MAINTAINED. `scripts/build-duration-calibration.mjs` produced the
// original skeleton; do not re-run it over this file or the real figures are
// lost. Add new services by hand.
//
// Durations are ELAPSED minutes on site for the stated crew, not man-minutes.
//
// Only the sizes the business actually quoted are `known`. The intermediate
// sizes are deliberately left `tbd` rather than interpolated — an invented
// duration is indistinguishable from a real one once it reaches a scheduler.

import { known, tbd } from "./types";
import type { AddOnDurationModel, DurationModel } from "./types";

const HOURS = (h: number) => h * 60;

/** The three property sizes the business gave figures for. */
const STUDIO = "Studio Apartment";
const TWO_BED = "2 Bedroom Apartment";
const SIX_BED = "6 Bedroom Townhouse";

/** Sizes quoted for pest work, which uses the same three anchors. */
const pestMinutes = () => ({
  [STUDIO]: known(HOURS(1)),
  [TWO_BED]: known(HOURS(2)),
  [SIX_BED]: known(HOURS(3)),
  "1 Bedroom Apartment": tbd("Pest treatment duration for a 1-bed apartment"),
  "3 Bedroom Apartment": tbd("Pest treatment duration for a 3-bed apartment"),
  Penthouse: tbd("Pest treatment duration for a penthouse"),
  "2 Bedroom Townhouse": tbd("Pest treatment duration for a 2-bed villa"),
  "3 Bedroom Townhouse": tbd("Pest treatment duration for a 3-bed villa"),
  "4 Bedroom Townhouse": tbd("Pest treatment duration for a 4-bed villa"),
  "5 Bedroom Townhouse": tbd("Pest treatment duration for a 5-bed villa"),
});

const pestCrew = (n: number) => ({
  [STUDIO]: known(n),
  [TWO_BED]: known(n),
  [SIX_BED]: known(n),
  "1 Bedroom Apartment": known(n),
  "3 Bedroom Apartment": known(n),
  Penthouse: known(n),
  "2 Bedroom Townhouse": known(n),
  "3 Bedroom Townhouse": known(n),
  "4 Bedroom Townhouse": known(n),
  "5 Bedroom Townhouse": known(n),
});

/** Global rules, applied to every service. */
const MIN_MINUTES = known(60); // shortest visit worth sending a crew for
const MAX_MINUTES = known(HOURS(8)); // above this, quote/site survey instead
const TOLERANCE = known(0.15); // customer sees ±15%

/** A pest treatment: identical shape, only the name differs. */
const pestModel = (serviceId: string, serviceName: string, crew: number): DurationModel => ({
  serviceId,
  serviceName,
  basis: "per-property",
  primaryDriver: "propertySize",
  secondaryDriver: null,
  baseCrew: known(crew),
  baseMinutes: known(0),
  minMinutes: MIN_MINUTES,
  maxMinutes: MAX_MINUTES,
  perDriverMinutes: pestMinutes(),
  perDriverCrew: pestCrew(crew),
  secondaryMultiplier: {},
  perUnitMinutes: tbd("Not applicable — priced per property"),
  toleranceFraction: TOLERANCE,
});

export const DURATION_MODELS: DurationModel[] = [
  // ── Whole-property cleaning ───────────────────────────────────────────────
  {
    serviceId: "SVC-102",
    serviceName: "Residential Deep Cleaning",
    basis: "per-property",
    primaryDriver: "propertySize",
    secondaryDriver: "furnishing",
    // Crew varies by size, so baseCrew is only the fallback for sizes that
    // have their own figure in perDriverCrew.
    baseCrew: known(2),
    // Per-size figures are whole-job durations, so there is no separate base.
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {
      [STUDIO]: known(HOURS(3)),
      [TWO_BED]: known(HOURS(5)),
      [SIX_BED]: known(HOURS(10)),
      "1 Bedroom Apartment": tbd("Deep clean duration for a 1-bed apartment"),
      "3 Bedroom Apartment": tbd("Deep clean duration for a 3-bed apartment"),
      Penthouse: tbd("Deep clean duration for a penthouse"),
      "2 Bedroom Townhouse": tbd("Deep clean duration for a 2-bed villa"),
      "3 Bedroom Townhouse": tbd("Deep clean duration for a 3-bed villa"),
      "4 Bedroom Townhouse": tbd("Deep clean duration for a 4-bed villa"),
      "5 Bedroom Townhouse": tbd("Deep clean duration for a 5-bed villa"),
    },
    perDriverCrew: {
      [STUDIO]: known(2),
      [TWO_BED]: known(3),
      [SIX_BED]: known(6),
      "1 Bedroom Apartment": tbd("Crew for a 1-bed apartment deep clean"),
      "3 Bedroom Apartment": tbd("Crew for a 3-bed apartment deep clean"),
      Penthouse: tbd("Crew for a penthouse deep clean"),
      "2 Bedroom Townhouse": tbd("Crew for a 2-bed villa deep clean"),
      "3 Bedroom Townhouse": tbd("Crew for a 3-bed villa deep clean"),
      "4 Bedroom Townhouse": tbd("Crew for a 4-bed villa deep clean"),
      "5 Bedroom Townhouse": tbd("Crew for a 5-bed villa deep clean"),
    },
    secondaryMultiplier: {
      Furnished: known(1.2), // ~20% longer than unfurnished
      Unfurnished: known(1.0),
    },
    perUnitMinutes: tbd("Not applicable — priced per property"),
    toleranceFraction: TOLERANCE,
  },

  {
    serviceId: "SVC-103",
    serviceName: "Residential Intense Deep Cleaning",
    basis: "per-property",
    primaryDriver: "propertySize",
    // No furnished/unfurnished split was quoted for Intense.
    secondaryDriver: null,
    baseCrew: known(2),
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {
      [STUDIO]: known(HOURS(6)),
      [TWO_BED]: known(HOURS(6)),
      [SIX_BED]: known(HOURS(10)),
      "1 Bedroom Apartment": tbd("Intense duration for a 1-bed apartment"),
      "3 Bedroom Apartment": tbd("Intense duration for a 3-bed apartment"),
      Penthouse: tbd("Intense duration for a penthouse"),
      "2 Bedroom Townhouse": tbd("Intense duration for a 2-bed villa"),
      "3 Bedroom Townhouse": tbd("Intense duration for a 3-bed villa"),
      "4 Bedroom Townhouse": tbd("Intense duration for a 4-bed villa"),
      "5 Bedroom Townhouse": tbd("Intense duration for a 5-bed villa"),
    },
    perDriverCrew: {
      [STUDIO]: known(2),
      [TWO_BED]: known(4),
      [SIX_BED]: known(7),
      "1 Bedroom Apartment": tbd("Crew for a 1-bed apartment intense clean"),
      "3 Bedroom Apartment": tbd("Crew for a 3-bed apartment intense clean"),
      Penthouse: tbd("Crew for a penthouse intense clean"),
      "2 Bedroom Townhouse": tbd("Crew for a 2-bed villa intense clean"),
      "3 Bedroom Townhouse": tbd("Crew for a 3-bed villa intense clean"),
      "4 Bedroom Townhouse": tbd("Crew for a 4-bed villa intense clean"),
      "5 Bedroom Townhouse": tbd("Crew for a 5-bed villa intense clean"),
    },
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Not applicable — priced per property"),
    toleranceFraction: TOLERANCE,
  },

  // ── Single rooms ──────────────────────────────────────────────────────────
  {
    serviceId: "SVC-106",
    serviceName: "Balcony Deep Cleaning",
    basis: "flat",
    primaryDriver: "none",
    secondaryDriver: null,
    baseCrew: known(2),
    baseMinutes: known(HOURS(1)), // per balcony
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Not applicable — flat per balcony"),
    toleranceFraction: TOLERANCE,
  },

  // ── Pest control ──────────────────────────────────────────────────────────
  pestModel("SVC-201", "General Pest Control (Gel & Spray)", 1),
  pestModel("SVC-202", "Cockroach Treatment", 1),
  pestModel("SVC-203", "Ant Treatment", 1),
  pestModel("SVC-204", "Bed Bug Treatment", 1),
  pestModel("SVC-205", "Rodent Control", 1),
  pestModel("SVC-206", "Flying Insect Treatment", 1),
  {
    serviceId: "SVC-207",
    serviceName: "External Perimeter Treatment",
    basis: "flat",
    primaryDriver: "none",
    secondaryDriver: null,
    baseCrew: tbd("Crew for an external perimeter treatment"),
    baseMinutes: known(HOURS(3)),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Not applicable — flat visit"),
    toleranceFraction: TOLERANCE,
  },
  pestModel("SVC-208", "Sanitisation & Disinfection", 2),

  // ── Soft furnishing ───────────────────────────────────────────────────────
  {
    serviceId: "SVC-107",
    serviceName: "Sofa Deep Cleaning & Shampoo",
    basis: "per-unit",
    primaryDriver: "seats",
    secondaryDriver: null,
    baseCrew: known(2),
    baseMinutes: known(HOURS(1)), // covers the first seat
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: known(15), // each seat after the first
    toleranceFraction: TOLERANCE,
  },
  {
    serviceId: "SVC-109",
    serviceName: "Mattress Deep Cleaning & Shampoo",
    basis: "per-unit",
    primaryDriver: "mattresses",
    secondaryDriver: null,
    baseCrew: known(2),
    baseMinutes: known(HOURS(1)), // covers the first mattress
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: known(HOURS(1)), // each mattress after the first
    toleranceFraction: TOLERANCE,
  },

  // ── Curtains ──────────────────────────────────────────────────────────────
  {
    serviceId: "SVC-110",
    serviceName: "Curtain & Chiffon Cleaning",
    basis: "flat",
    primaryDriver: "none",
    secondaryDriver: null,
    // Off-site service: curtains are taken away and returned in a day or two.
    // The quoted "next day or two" is a turnaround, not time on site.
    baseCrew: tbd("Crew for the take-down and re-fix visits"),
    baseMinutes: tbd("On-site minutes for take-down, and again for re-fixing"),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("On-site minutes per panel, if it scales"),
    toleranceFraction: TOLERANCE,
  },
  {
    serviceId: "SVC-112",
    serviceName: "On-Site Curtain Steam Ironing",
    basis: "per-unit",
    // Duration is driven by curtain size, which the booking flow does not yet
    // collect — see the note in the validation report.
    primaryDriver: "panels",
    secondaryDriver: null,
    baseCrew: tbd("Crew for on-site curtain steam ironing"),
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {
      Small: known(40),
      Medium: known(60),
      Large: known(80),
    },
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Minutes per panel when size is not specified"),
    toleranceFraction: TOLERANCE,
  },
  {
    serviceId: "SVC-407",
    serviceName: "Curtain Supply, Stitching & Installation",
    basis: "per-unit",
    primaryDriver: "panels",
    secondaryDriver: null,
    baseCrew: tbd("Crew for curtain supply and installation"),
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: known(HOURS(3)), // per window
    toleranceFraction: TOLERANCE,
  },

  // ── Windows ───────────────────────────────────────────────────────────────
  {
    serviceId: "SVC-115",
    serviceName: "Internal & External Window Cleaning",
    basis: "per-unit",
    primaryDriver: "panels",
    // Rate differs by property type: apartments 1.5h/window, villas 2.5h.
    secondaryDriver: "propertySize",
    baseCrew: known(1),
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    // Apartment rate; the villa rate needs a property-type input to select.
    perUnitMinutes: known(90),
    toleranceFraction: TOLERANCE,
  },

  // ── Hotel laundry ─────────────────────────────────────────────────────────
  {
    serviceId: "SVC-111",
    serviceName: "Hotel Laundry & Linen Service",
    basis: "flat",
    primaryDriver: "none",
    secondaryDriver: null,
    baseCrew: known(1),
    baseMinutes: known(20), // collection visit; returned next day
    minMinutes: known(20), // genuinely shorter than the global floor
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Not applicable — flat collection visit"),
    toleranceFraction: TOLERANCE,
  },

  // ── Water tanks ───────────────────────────────────────────────────────────
  {
    serviceId: "SVC-301",
    serviceName: "Water Tank Cleaning & Disinfection",
    basis: "per-property",
    primaryDriver: "tankSize",
    secondaryDriver: "tankLocation",
    baseCrew: known(2),
    baseMinutes: known(0),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {
      "500 US gal / approx. 1,892 L": known(HOURS(3)),
      "5,000 US gal / approx. 18,925 L": known(HOURS(6)),
      "20,000 US gal / approx. 75,700 L": known(HOURS(10)),
      "1,000 US gal / approx. 3,785 L": tbd("Duration for a 1,000 gallon tank"),
      "2,000 US gal / approx. 7,570 L": tbd("Duration for a 2,000 gallon tank"),
      "10,000 US gal / approx. 37,850 L": tbd("Duration for a 10,000 gallon tank"),
    },
    perDriverCrew: {
      "500 US gal / approx. 1,892 L": known(2),
      "5,000 US gal / approx. 18,925 L": known(4),
      "20,000 US gal / approx. 75,700 L": known(7),
      "1,000 US gal / approx. 3,785 L": tbd("Crew for a 1,000 gallon tank"),
      "2,000 US gal / approx. 7,570 L": tbd("Crew for a 2,000 gallon tank"),
      "10,000 US gal / approx. 37,850 L": tbd("Crew for a 10,000 gallon tank"),
    },
    secondaryMultiplier: {
      Underground: known(1.2), // 20% longer than rooftop
      "Rooftop / Above-Ground": known(1.0),
    },
    perUnitMinutes: tbd("Not applicable — priced per tank"),
    toleranceFraction: TOLERANCE,
  },

  // ── Commercial ────────────────────────────────────────────────────────────
  {
    serviceId: "SVC-114",
    serviceName: "Kiosk & Stand Cleaning",
    basis: "flat",
    primaryDriver: "none",
    secondaryDriver: null,
    baseCrew: tbd("Crew for a kiosk or stand clean"),
    baseMinutes: tbd("Elapsed minutes for a typical kiosk clean"),
    minMinutes: MIN_MINUTES,
    maxMinutes: MAX_MINUTES,
    perDriverMinutes: {},
    perDriverCrew: {},
    secondaryMultiplier: {},
    perUnitMinutes: tbd("Minutes per additional kiosk, if it scales"),
    toleranceFraction: TOLERANCE,
  },
];

export const ADD_ON_DURATIONS: AddOnDurationModel[] = [
  {
    addOnId: "ADD-01",
    addOnName: "Refrigerator Interior Cleaning",
    scalesWith: "none",
    flatMinutes: known(60),
    perUnitMinutes: tbd("Not applicable — flat add-on"),
    extraCrew: known(0),
  },
  {
    addOnId: "ADD-02",
    addOnName: "Oven Interior Cleaning",
    scalesWith: "none",
    flatMinutes: known(30),
    perUnitMinutes: tbd("Not applicable — flat add-on"),
    extraCrew: known(0),
  },
  {
    addOnId: "ADD-03",
    addOnName: "Mattress Shampooing",
    scalesWith: "mattresses",
    flatMinutes: known(0),
    perUnitMinutes: known(60),
    // "Depends on number of units" — needs a threshold before it is usable.
    extraCrew: tbd("At how many mattresses does this need an extra person?"),
  },
  {
    addOnId: "ADD-04",
    addOnName: "Sofa Shampooing",
    scalesWith: "seats",
    flatMinutes: known(60), // first seat
    perUnitMinutes: known(20), // each further seat
    extraCrew: tbd("At how many seats does this need an extra person?"),
  },
  {
    addOnId: "ADD-05",
    addOnName: "Carpet Shampooing",
    scalesWith: "squareMetres",
    // Quoted as "+60 minutes per medium size", but the add-on is defined
    // per square metre. The two units do not reconcile — see the report.
    flatMinutes: tbd("Is 60 minutes the whole job, or per carpet?"),
    perUnitMinutes: tbd("Minutes per square metre, or define carpet size bands"),
    extraCrew: tbd("At what area does this need an extra person?"),
  },
  {
    addOnId: "ADD-06",
    addOnName: "Intense Deep Cleaning Upgrade",
    scalesWith: "none",
    flatMinutes: known(120),
    perUnitMinutes: tbd("Not applicable — flat add-on"),
    extraCrew: known(1),
  },
  {
    addOnId: "ADD-08",
    addOnName: "Intense Kitchen Deep Cleaning",
    scalesWith: "none",
    flatMinutes: known(180),
    perUnitMinutes: tbd("Not applicable — flat add-on"),
    extraCrew: known(1),
  },
  {
    addOnId: "ADD-09",
    addOnName: "Intense Bathroom Deep Cleaning",
    scalesWith: "bathrooms",
    flatMinutes: known(0),
    perUnitMinutes: known(60),
    extraCrew: known(1),
  },
  {
    addOnId: "ADD-10",
    addOnName: "Balcony Deep Cleaning",
    scalesWith: "balconies",
    flatMinutes: known(0),
    perUnitMinutes: known(60),
    // Quoted as "2 cleaners" — read as one extra person over the base crew.
    extraCrew: known(1),
  },
  {
    addOnId: "ADD-11",
    addOnName: "Curtain Steam Ironing",
    scalesWith: "panels",
    flatMinutes: known(0),
    perUnitMinutes: known(30), // per piece
    extraCrew: known(0),
  },
];
