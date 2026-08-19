// ─────────────────────────────────────────────────────────────────────────────
//  BATHROOM INTENSE DEEP CLEANING — SVC-105
//
//  HAND-MAINTAINED. Prices supplied by the business.
//
//  Price = 299 for the first bathroom
//        + 179 for each additional bathroom
//        +  49 per bathtub
//        +  49 per glass shower enclosure
//        +  89 per bathroom where there is heavy scale
// ─────────────────────────────────────────────────────────────────────────────

import type { ChoiceQuestion, ScaleLevel } from "./types";

/** AED, exclusive of VAT. */
export const BATHROOM_PRICING = {
  firstBathroom: 299,
  additionalBathroom: 179,
  perBathtub: 49,
  perGlassEnclosure: 49,
  /** Applied per bathroom, not per job. */
  perBathroomHeavyScale: 89,
};

/** Above this many bathrooms the job is surveyed rather than priced online. */
export const MAX_BATHROOMS_ONLINE = 6;

// ── questions ───────────────────────────────────────────────────────────────

export const BATHROOM_QUESTIONS: ChoiceQuestion[] = [
  {
    id: "bathrooms",
    question: "How many bathrooms need deep cleaning?",
    help: null,
    kind: "count",
    min: 1,
    max: MAX_BATHROOMS_ONLINE,
    unitNoun: "bathroom",
    options: [],
  },
  {
    id: "bathtubs",
    question: "How many have a bathtub?",
    help: "Scrubbing a tub takes noticeably longer than a shower tray.",
    kind: "count",
    min: 0,
    max: MAX_BATHROOMS_ONLINE,
    unitNoun: "bathtub",
    options: [],
  },
  {
    id: "glassEnclosures",
    question: "How many have a glass shower screen or enclosure?",
    help: "Glass has to be descaled and polished, which is the other time sink.",
    kind: "count",
    min: 0,
    max: MAX_BATHROOMS_ONLINE,
    unitNoun: "enclosure",
    options: [],
  },
  {
    id: "scale",
    question: "Is there white scale on the glass or taps that does not wipe off?",
    help: "Match the closest picture. If you are not sure, say so — we will not guess against you.",
    kind: "single",
    options: [
      { id: "none", label: "No, none", caption: "Wipes clean", image: null },
      { id: "light", label: "A little", caption: "Faint cloudiness on glass or taps", image: null },
      {
        id: "moderate",
        label: "Some",
        caption: "Visible white marks that resist wiping",
        image: null,
      },
      {
        id: "heavy",
        label: "A lot",
        caption: "Thick white crust on glass, taps or tiles",
        image: null,
      },
      { id: "not-sure", label: "Not sure", caption: "We will check on arrival", image: null },
    ],
  },
];

/** Only the heaviest tier carries a surcharge. */
export const chargesScaleSurcharge = (scale: ScaleLevel): boolean => scale === "heavy";

/**
 * What we promise when the customer could not tell us the condition.
 *
 * Priced at the standard tier and told plainly what happens if the crew finds
 * worse. The alternative — quietly assuming the worst — would overcharge every
 * honest customer who simply did not know.
 */
export const NOT_SURE_POLICY =
  "We will price this at the standard rate. If the crew finds heavy scale on arrival they will show you photographs and the revised price before starting.";

/**
 * The condition-change promise, shown at checkout rather than buried in terms.
 *
 * Any price built on a customer's own description of dirt needs this. Without
 * it, an honest description is a risk to the customer and a vague one is a risk
 * to us; with it, both sides can rely on the number.
 */
export const CONDITION_CHANGE_POLICY = {
  heading: "If the condition is heavier than described",
  body: "Our team will show you photographs and a revised price before starting any work. You are free to go ahead, reduce the scope, or cancel with no charge.",
};
