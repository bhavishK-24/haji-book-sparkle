/**
 * Generates the duration calibration skeleton from the live catalogue.
 *
 *   node scripts/build-duration-calibration.mjs
 *
 * Every bookable service gets a model whose `perDriverMinutes` keys are the
 * exact Variant_Attribute values from the workbook, so the estimate joins onto
 * what the customer already selected. All figures are emitted as `tbd(...)`
 * with the question that must be answered — this script never invents a value.
 *
 * Re-run after a catalogue change to pick up new services; existing answers
 * are NOT preserved, so fill the file in only once the catalogue is stable.
 */
import { readFileSync, writeFileSync } from "node:fs";

const GENERATED = "src/data/service-catalogue.generated.ts";
const OUT = "src/data/duration/calibration.ts";

// Read the generated catalogue as text and pull out what we need. Importing it
// would require a TS runtime; a targeted parse keeps this script dependency-free.
const src = readFileSync(GENERATED, "utf8");

/** Crude but sufficient object-literal scan of the SERVICES array. */
function parseServices() {
  const out = [];
  const body = src.slice(src.indexOf("export const SERVICES"));
  for (const block of body.split(/\n  \{\n/).slice(1)) {
    const get = (k) => {
      const m = block.match(new RegExp(`^    ${k}: (.*?),$`, "m"));
      return m ? m[1] : null;
    };
    const str = (k) => {
      const v = get(k);
      return v && v !== "null" ? JSON.parse(v) : null;
    };
    const id = str("id");
    if (!id) continue;
    const variantsRaw = block.match(/variants: \[([\s\S]*?)\n    \],/);
    const variants = [];
    if (variantsRaw) {
      // Split on the object boundary, not on newlines: the generated file is
      // formatted by prettier, so a variant may span several lines and a
      // line-wise scan silently loses attribute2 (furnishing, tank location).
      for (const chunk of variantsRaw[1].split(/\},\s*/)) {
        const a1 = chunk.match(/attribute1: (null|"[^"]*")/);
        const a2 = chunk.match(/attribute2: (null|"[^"]*")/);
        if (a1) {
          variants.push({
            a1: a1[1] === "null" ? null : JSON.parse(a1[1]),
            a2: a2 && a2[1] !== "null" ? JSON.parse(a2[1]) : null,
          });
        }
      }
    }
    out.push({
      id,
      name: str("name"),
      bookingType: str("bookingType"),
      pricingUnit: str("pricingUnit"),
      pricingModel: str("pricingModel"),
      variants,
    });
  }
  return out;
}

function parseAddOns() {
  const out = [];
  const body = src.slice(
    src.indexOf("export const ADD_ONS"),
    src.indexOf("export const ADD_ON_SUPPRESSES"),
  );
  for (const block of body.split(/\n  \{\n/).slice(1)) {
    const str = (k) => {
      const m = block.match(new RegExp(`^    ${k}: (.*?),$`, "m"));
      return m && m[1] !== "null" ? JSON.parse(m[1]) : null;
    };
    const id = str("id");
    if (!id) continue;
    const visible = /visible: true/.test(block);
    out.push({ id, name: str("name"), quantityInput: str("quantityInput"), visible });
  }
  return out;
}

const services = parseServices();
const addOns = parseAddOns();

const BOOKABLE = new Set(["instant", "scheduled"]);
const bookable = services.filter((s) => BOOKABLE.has(s.bookingType));

/** Map a pricing unit to the quantity that drives duration. */
const UNIT_DRIVER = {
  "Per Property": "propertySize",
  "Per Seat": "seats",
  "Per Mattress": "mattresses",
  "Per Panel": "panels",
  "Per Panel / Per Track": "panels",
  "Per Sq M": "squareMetres",
  "Per Tank": "tankSize",
  "Per Kitchen": "none",
  "Per Bathroom": "none",
  "Per Balcony": "none",
  "Per Type": "none",
  "Per Property / Per Sq M": "propertySize",
};

const BASIS = {
  propertySize: "per-property",
  seats: "per-unit",
  mattresses: "per-unit",
  panels: "per-unit",
  squareMetres: "per-area",
  tankSize: "per-unit",
  none: "flat",
};

const q = (v) => JSON.stringify(v);

const L = [];
L.push(`// ⚠️ GENERATED SKELETON — fill in the values, then stop regenerating.`);
L.push(`//`);
L.push(`// Produced by scripts/build-duration-calibration.mjs from the live`);
L.push(`// catalogue, so every key matches a real Variant_Attribute value.`);
L.push(`//`);
L.push(`// Replace each \`tbd("...")\` with \`known(<minutes>)\` or \`known(<crew>)\``);
L.push(`// as the business supplies real figures. Anything left as tbd() simply`);
L.push(`// means the engine reports "estimate unavailable" rather than guessing.`);
L.push(`//`);
L.push(`// Durations are ELAPSED minutes on site for the stated crew — not`);
L.push(`// man-minutes. Two cleaners for 90 minutes is 90, not 180.`);
L.push(``);
L.push(`import { known, tbd } from "./types";`);
L.push(`import type { AddOnDurationModel, DurationModel } from "./types";`);
L.push(``);
L.push(`// \`known\` is unused until the first real figure is entered.`);
L.push(`void known;`);
L.push(``);
L.push(`export const DURATION_MODELS: DurationModel[] = [`);

for (const s of bookable) {
  const driver = UNIT_DRIVER[s.pricingUnit] ?? "none";
  const basis = BASIS[driver] ?? "flat";
  const a1 = [...new Set(s.variants.map((v) => v.a1).filter(Boolean))];
  const a2 = [...new Set(s.variants.map((v) => v.a2).filter(Boolean))];
  const secondary =
    a2.includes("Furnished") || a2.includes("Unfurnished")
      ? "furnishing"
      : a2.some((v) => /Underground|Rooftop/.test(v))
        ? "tankLocation"
        : null;

  L.push(`  {`);
  L.push(`    serviceId: ${q(s.id)},`);
  L.push(`    serviceName: ${q(s.name)},`);
  L.push(`    basis: ${q(basis)},`);
  L.push(`    primaryDriver: ${q(driver)},`);
  L.push(`    secondaryDriver: ${secondary ? q(secondary) : "null"},`);
  L.push(`    baseCrew: tbd(${q(`Crew size for a typical ${s.name}`)}),`);
  L.push(`    baseMinutes: tbd(${q(`Elapsed minutes for the smallest ${s.name} job`)}),`);
  L.push(`    minMinutes: tbd("Shortest visit you would ever send a crew out for"),`);
  L.push(`    maxMinutes: tbd("Longest job still bookable online rather than surveyed"),`);

  if (a1.length > 1) {
    L.push(`    perDriverMinutes: {`);
    for (const key of a1) {
      L.push(`      ${q(key)}: tbd(${q(`Elapsed minutes: ${s.name} — ${key}`)}),`);
    }
    L.push(`    },`);
  } else {
    L.push(`    perDriverMinutes: {},`);
  }

  if (secondary && a2.length) {
    L.push(`    secondaryMultiplier: {`);
    for (const key of a2) {
      L.push(`      ${q(key)}: tbd(${q(`Multiplier for ${key} (1.0 = no difference)`)}),`);
    }
    L.push(`    },`);
  } else {
    L.push(`    secondaryMultiplier: {},`);
  }

  const perUnit =
    basis === "per-unit" || basis === "per-area"
      ? `tbd(${q(`Extra elapsed minutes per additional ${driver === "squareMetres" ? "m²" : driver.replace(/s$/, "")}`)})`
      : `tbd("Not applicable unless this service scales per unit")`;
  L.push(`    perUnitMinutes: ${perUnit},`);
  L.push(`    toleranceFraction: tbd("How wide should the quoted range be? e.g. 0.15 for ±15%"),`);
  L.push(`  },`);
}
L.push(`];`);
L.push(``);
L.push(`export const ADD_ON_DURATIONS: AddOnDurationModel[] = [`);
for (const a of addOns.filter((x) => x.visible)) {
  L.push(`  {`);
  L.push(`    addOnId: ${q(a.id)},`);
  L.push(`    addOnName: ${q(a.name)},`);
  L.push(`    scalesWith: ${q(a.quantityInput ?? "none")},`);
  L.push(`    flatMinutes: tbd(${q(`Minutes added by ${a.name}`)}),`);
  L.push(
    a.quantityInput
      ? `    perUnitMinutes: tbd(${q(`Extra minutes per ${a.quantityInput.replace(/s$/, "")} for ${a.name}`)}),`
      : `    perUnitMinutes: tbd("Not applicable — flat add-on"),`,
  );
  L.push(`    extraCrew: tbd(${q(`Does ${a.name} need an extra person? 0 if not`)}),`);
  L.push(`  },`);
}
L.push(`];`);
L.push(``);

writeFileSync(OUT, L.join("\n"), "utf8");
console.log(`bookable services modelled: ${bookable.length}`);
console.log(`add-ons modelled:           ${addOns.filter((a) => a.visible).length}`);
console.log(`written: ${OUT}`);
