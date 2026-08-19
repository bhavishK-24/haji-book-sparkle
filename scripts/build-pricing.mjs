/**
 * Generates `src/data/pricing-catalogue.generated.ts` from the Pricing
 * Calculator workbook.
 *
 *   node scripts/build-pricing.mjs "<Pricing Calculator>.xlsx"
 *
 * The Pricing Calculator is the source of truth for MONEY. The Service Master
 * remains the source of truth for scope, descriptions and booking rules — its
 * `Variant_Pricing` figures are older and are deliberately not read here.
 *
 * Every price in the workbook is recorded EXCLUSIVE of VAT. Nothing in this
 * script rounds, interpolates or derives a price: a row either carries a
 * figure the business entered or it carries none.
 */
import { writeFileSync } from "node:fs";
import { openWorkbook } from "./lib/xlsx.mjs";

const XLSX = process.argv[2];
const OUT = process.argv[3] ?? "src/data/pricing-catalogue.generated.ts";
if (!XLSX) throw new Error("usage: node scripts/build-pricing.mjs <Pricing Calculator.xlsx>");

const wb = openWorkbook(XLSX);
const q = (s) => (s === null || s === undefined ? "null" : JSON.stringify(s));

/**
 * A cell that should hold a number but might hold "TBD", a blank, or a note
 * the business typed in place of a figure ("As per site visit").
 */
const num = (v) => {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (!t || /^TBD$/i.test(t)) return null;
  const n = Number(t.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Free text sitting in a numeric column is an instruction, not a value. */
const noteOf = (v) => {
  const t = (v ?? "").toString().trim();
  if (!t || /^TBD$/i.test(t) || Number.isFinite(Number(t.replace(/,/g, "")))) return null;
  return t;
};

/**
 * "On qoute" (sic) and "As per site visit" both mean the same thing: do not
 * show an online price, route the customer to a human.
 */
const QUOTE_NOTE = /on\s*qoute|on\s*quote|site\s*visit|survey/i;

/**
 * The workbook labels villas "Townhouse" on the older pest rows and "Villa"
 * on everything entered since. They are the same property type — normalising
 * here keeps one property ladder instead of two that silently miss each other.
 */
const normaliseProperty = (s) => (s ?? "").replace(/\bTownhouse\b/gi, "Villa").trim();

/**
 * Services the business priced by pointing at another service.
 *
 * These notes are pricing instructions, not commentary — "Same as Cockroach
 * treatment" against a blank price column means exactly that, and the whole
 * table was left blank because retyping it would be duplication. Copying is
 * what the note says to do; it is not an interpolation.
 *
 * Every other note in the workbook is handled in `src/data/note-rules.ts`,
 * which is the single place the rules are written down.
 */
const PRICE_ALIASES = {
  "SVC-203": "SVC-202", // "Same as Cockroach treatment"
  "SVC-206": "SVC-201", // "Same as General Pest Control"
};

// ── rate card ───────────────────────────────────────────────────────────────
const inputs = wb.sheet("Inputs");
const rateCell = (label) => {
  const row = inputs.find((r) => (r[0] ?? "").trim().toLowerCase() === label.toLowerCase());
  return row ? num(row[1]) : null;
};

const RATE_CARD = {
  labourCostPerPersonHour: rateCell("Labour cost per person-hour"),
  overheadRate: rateCell("Overhead rate"),
  targetGrossMargin: rateCell("Target gross margin"),
  defaultMaterialsPerJob: rateCell("Default materials per job"),
  defaultTransportPerVisit: rateCell("Default transport per visit"),
  vatRate: rateCell("VAT rate"),
  roundToNearest: rateCell("Round prices to nearest"),
};
for (const [k, v] of Object.entries(RATE_CARD)) {
  if (v === null) throw new Error(`Rate card is missing "${k}" — the Inputs sheet is incomplete.`);
}

// ── row readers ─────────────────────────────────────────────────────────────
/**
 * Reads one priced sheet into a flat row list.
 *
 * `cols` maps the meaning we need onto that sheet's column positions, which
 * differ between sheets — Unit_Pricing carries an extra "Units covered"
 * column, so its price sits one place to the right of Property_Pricing's.
 */
function readPriced(sheetName, headerRow, cols) {
  const rows = wb.sheet(sheetName);
  const out = [];
  /* A note typed on the first row of a service applies to that whole block. */
  let carriedNote = null;
  let carriedFor = null;

  for (const r of rows.slice(headerRow + 1)) {
    const id = (r[cols.id] ?? "").trim();
    if (!/^(SVC|ADD)-\d+$/.test(id)) continue;

    if (carriedFor !== id) {
      carriedFor = id;
      carriedNote = null;
    }
    const note = noteOf(r[cols.note]);
    if (note) carriedNote = note;

    const label = (
      cols.normalise ? normaliseProperty(r[cols.label]) : (r[cols.label] ?? "")
    ).trim();
    const priceExVat = num(r[cols.price]);
    const effectiveNote = note ?? carriedNote;

    out.push({
      id,
      label,
      attribute: cols.attribute === undefined ? null : (r[cols.attribute] ?? "").trim() || null,
      unit: cols.unit === undefined ? null : (r[cols.unit] ?? "").trim() || null,
      unitsCovered: cols.unitsCovered === undefined ? null : num(r[cols.unitsCovered]),
      priceExVat,
      pricePerUnit: cols.perUnit === undefined ? null : num(r[cols.perUnit]),
      crew: cols.crew === undefined ? null : num(r[cols.crew]),
      hours: cols.hours === undefined ? null : num(r[cols.hours]),
      /* Only surface a note when it is standing in for a missing price. */
      note: priceExVat === null ? effectiveNote : null,
      quoteOnly: priceExVat === null && QUOTE_NOTE.test(effectiveNote ?? ""),
    });
  }
  return out;
}

const propertyRows = readPriced("Property_Pricing", 3, {
  id: 0,
  label: 2,
  attribute: 3,
  crew: 4,
  hours: 5,
  price: 16,
  note: 4,
  normalise: true,
});

const unitRows = readPriced("Unit_Pricing", 3, {
  id: 0,
  label: 2,
  unit: 3,
  unitsCovered: 4,
  crew: 5,
  hours: 6,
  price: 17,
  perUnit: 20,
  note: 5,
  normalise: true,
});

const addOnRows = readPriced("Add_Ons", 3, {
  id: 0,
  label: 1,
  unit: 3,
  unitsCovered: 4,
  crew: 5,
  hours: 6,
  price: 17,
  perUnit: 20,
  note: 5,
});

const manpowerRows = wb
  .sheet("Manpower")
  .slice(4)
  .filter((r) => /^SVC-\d+$/.test((r[0] ?? "").trim()))
  .map((r) => ({
    id: r[0].trim(),
    label: (r[1] ?? "").trim(),
    attribute: null,
    unit: "Per month",
    unitsCovered: null,
    priceExVat: num(r[11]),
    pricePerUnit: num(r[14]),
    crew: null,
    hours: null,
    note: num(r[11]) === null ? noteOf(r[2]) : null,
    quoteOnly: num(r[11]) === null && QUOTE_NOTE.test(noteOf(r[2]) ?? ""),
  }));

// ── aliases ─────────────────────────────────────────────────────────────────
/*
 * Copy a source service's rows under the aliased id, but never overwrite a row
 * the business priced explicitly.
 */
for (const [target, source] of Object.entries(PRICE_ALIASES)) {
  const explicit = new Set(
    propertyRows.filter((r) => r.id === target && r.priceExVat !== null).map((r) => r.label),
  );
  const copies = propertyRows
    .filter((r) => r.id === source && r.priceExVat !== null && !explicit.has(r.label))
    .map((r) => ({ ...r, id: target, aliasOf: source }));

  /* Drop the empty placeholder rows the alias replaces. */
  for (let i = propertyRows.length - 1; i >= 0; i--) {
    const r = propertyRows[i];
    if (r.id === target && r.priceExVat === null && copies.some((c) => c.label === r.label)) {
      propertyRows.splice(i, 1);
    }
  }
  propertyRows.push(...copies);
}

// ── emit ────────────────────────────────────────────────────────────────────
const L = [];
L.push(`// ⚠️ GENERATED FILE — DO NOT EDIT BY HAND.`);
L.push(`//`);
L.push(`// Source: ${XLSX.split(/[\\/]/).pop()}`);
L.push(`// Sheets: Inputs, Property_Pricing, Unit_Pricing, Add_Ons, Manpower`);
L.push(`// Regenerate: node scripts/build-pricing.mjs "<Pricing Calculator>.xlsx"`);
L.push(`//`);
L.push(`// Every price is EXCLUSIVE of VAT, as recorded. Rows the business left`);
L.push(`// blank carry a null price — never a zero and never a guess.`);
L.push(``);
L.push(`import type { PriceRow, RateCard } from "./pricing-types";`);
L.push(``);
L.push(`export const RATE_CARD: RateCard = ${JSON.stringify(RATE_CARD, null, 2)};`);
L.push(``);

const emit = (name, rows) => {
  L.push(`export const ${name}: PriceRow[] = [`);
  for (const r of rows) {
    const f = [
      `id: ${q(r.id)}`,
      `label: ${q(r.label)}`,
      `attribute: ${q(r.attribute)}`,
      `unit: ${q(r.unit)}`,
      `unitsCovered: ${r.unitsCovered ?? "null"}`,
      `priceExVat: ${r.priceExVat ?? "null"}`,
      `pricePerUnit: ${r.pricePerUnit ?? "null"}`,
      `crew: ${r.crew ?? "null"}`,
      `hours: ${r.hours ?? "null"}`,
      `note: ${q(r.note)}`,
      `quoteOnly: ${r.quoteOnly}`,
      `aliasOf: ${q(r.aliasOf ?? null)}`,
    ];
    L.push(`  { ${f.join(", ")} },`);
  }
  L.push(`];`);
  L.push(``);
};

/*
 * The property ladder, emitted as a literal tuple so the booking UI keeps a
 * real union type instead of falling back to bare `string`. Order follows the
 * workbook: apartments smallest-first, then penthouse, then villas.
 */
const ladder = [...new Set(propertyRows.map((r) => r.label))];
L.push(`export const PROPERTY_LADDER = ${JSON.stringify(ladder, null, 2)} as const;`);
L.push(``);
L.push(`/** Furnishing values the workbook actually prices against. */`);
const furnishings = [
  ...new Set(propertyRows.map((r) => r.attribute).filter((a) => a && !/not applicable/i.test(a))),
];
L.push(`export const FURNISHING_VALUES = ${JSON.stringify(furnishings, null, 2)} as const;`);
L.push(``);

emit("PROPERTY_PRICES", propertyRows);
emit("UNIT_PRICES", unitRows);
emit("ADD_ON_PRICES", addOnRows);
emit("MANPOWER_PRICES", manpowerRows);

writeFileSync(OUT, L.join("\n"), "utf8");

// ── summary ─────────────────────────────────────────────────────────────────
const all = [...propertyRows, ...unitRows, ...addOnRows, ...manpowerRows];
const count = (rows) => `${rows.filter((r) => r.priceExVat !== null).length}/${rows.length} priced`;
console.log(
  `rate card           labour ${RATE_CARD.labourCostPerPersonHour}/person-hr, margin ${RATE_CARD.targetGrossMargin * 100}%, VAT ${RATE_CARD.vatRate * 100}%`,
);
console.log(`property prices     ${count(propertyRows)}`);
console.log(`unit prices         ${count(unitRows)}`);
console.log(`add-on prices       ${count(addOnRows)}`);
console.log(`manpower prices     ${count(manpowerRows)}`);
console.log(`quote-only rows     ${all.filter((r) => r.quoteOnly).length}`);
const sizes = [...new Set(propertyRows.map((r) => r.label))];
console.log(`property ladder     ${sizes.length}: ${sizes.join(", ")}`);
