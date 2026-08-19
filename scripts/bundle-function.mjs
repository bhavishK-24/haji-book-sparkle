/**
 * Bundles the notify-dispatch Edge Function into one paste-able file.
 *
 *   node scripts/bundle-function.mjs
 *
 * The repo keeps the function split across `index.ts` and `templates.ts`,
 * which is how the Supabase CLI deploys it. The dashboard's function editor is
 * easier to paste a single file into, so this inlines the template module and
 * hoists every import to the top.
 *
 * Output is generated — edit the source files, never the bundle.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const DIR = "supabase/functions/notify-dispatch";
const OUT = "supabase/apply/notify-dispatch.bundled.ts";

const templates = readFileSync(`${DIR}/templates.ts`, "utf8");
const dispatcher = readFileSync(`${DIR}/index.ts`, "utf8");

/** Pull every top-level import out, so they can be re-emitted at the top. */
const imports = new Set();
const stripImports = (source) =>
  source.replace(/^import .*?;\n/gm, (line) => {
    /* The template module is inlined below, so its import must not survive. */
    if (!line.includes("./templates.ts")) imports.add(line.trim());
    return "";
  });

const body = [
  "// ── dispatcher ──────────────────────────────────────────────────────────",
  "",
  stripImports(dispatcher).trim(),
].join("\n");

const head = [
  "// ── SINGLE-FILE BUILD — for pasting into the Supabase dashboard ──────────",
  "//",
  "// Generated from supabase/functions/notify-dispatch/{index,templates}.ts.",
  "// Edit those, not this. Regenerate with: node scripts/bundle-function.mjs",
  "",
  ...imports,
  "",
].join("\n");

mkdirSync("supabase/apply", { recursive: true });
writeFileSync(OUT, [head, stripImports(templates).trim(), "", body, ""].join("\n"), "utf8");

// ── sanity checks ───────────────────────────────────────────────────────────
const result = readFileSync(OUT, "utf8");
const lines = result.split("\n");
const importLines = lines.map((l, i) => [l, i + 1]).filter(([l]) => /^import /.test(l));
const firstCode = lines.findIndex((l) => l.trim() && !l.startsWith("//") && !/^import /.test(l));

const problems = [];
if (importLines.some(([, n]) => n > firstCode + 1))
  problems.push("an import is below the first code line");
if ((result.match(/export function render/g) ?? []).length !== 1)
  problems.push("render() is not defined exactly once");
if (!/Deno\.serve/.test(result)) problems.push("Deno.serve is missing");
if (/from "\.\/templates\.ts"/.test(result)) problems.push("the templates import survived");

console.log(`${OUT} — ${lines.length} lines`);
console.log(`imports hoisted: ${importLines.map(([l]) => l).join(" | ") || "(none)"}`);
console.log(problems.length ? `PROBLEMS: ${problems.join("; ")}` : "bundle looks correct");
if (problems.length) process.exit(1);
