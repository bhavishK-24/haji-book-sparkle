/**
 * Minimal xlsx reader — enough to pull cell values out of a workbook without
 * taking on a dependency.
 *
 * Shared by `build-catalogue.mjs` and `build-pricing.mjs`, which read two
 * different workbooks with the same quirks.
 */
import { readFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";

const decode = (s) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, "&");

const colIndex = (ref) => {
  const letters = ref.match(/^[A-Z]+/)[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

/** Opens a workbook and returns `sheet(name) -> string[][]`. */
export function openWorkbook(xlsxPath) {
  const dir = mkdtempSync(path.join(tmpdir(), "xlsx-"));
  execFileSync("unzip", ["-o", xlsxPath, "-d", dir], { stdio: "ignore" });

  const shared = [];
  try {
    const ssXml = readFileSync(`${dir}/xl/sharedStrings.xml`, "utf8");
    for (const m of ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
      let t = "";
      for (const x of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) t += x[1];
      shared.push(decode(t));
    }
  } catch {
    // A workbook with no strings at all is legal, if unlikely.
  }

  function readSheet(file) {
    const xml = readFileSync(`${dir}/xl/worksheets/${file}`, "utf8");
    const rows = [];
    for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      // Self-closing <c/> must be matched, or an empty cell swallows the next one.
      for (const cm of rm[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ref = cm[1].match(/r="([A-Z]+\d+)"/)?.[1];
        if (!ref) continue;
        const type = cm[1].match(/t="([^"]+)"/)?.[1];
        const body = cm[2] ?? "";
        let value = "";
        if (type === "inlineStr") {
          for (const t of body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) value += t[1];
          value = decode(value);
        } else {
          const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
          if (v !== undefined) value = type === "s" ? (shared[+v] ?? "") : decode(v);
        }
        cells[colIndex(ref)] = value;
      }
      rows.push(cells);
    }
    const width = Math.max(0, ...rows.map((r) => r.length));
    return rows.map((r) => Array.from({ length: width }, (_, i) => (r[i] ?? "").toString().trim()));
  }

  const wb = readFileSync(`${dir}/xl/workbook.xml`, "utf8");
  const rels = readFileSync(`${dir}/xl/_rels/workbook.xml.rels`, "utf8");
  const relTarget = new Map(
    [...rels.matchAll(/Id="([^"]+)"[^>]*Target="worksheets\/([^"]+)"/g)].map((m) => [m[1], m[2]]),
  );
  const sheets = new Map(
    [...wb.matchAll(/name="([^"]+)"[^>]*r:id="([^"]+)"/g)].map((m) => [m[1], relTarget.get(m[2])]),
  );

  return {
    sheetNames: () => [...sheets.keys()],
    sheet: (name) => {
      const file = sheets.get(name);
      if (!file) throw new Error(`No sheet named "${name}" in ${path.basename(xlsxPath)}`);
      return readSheet(file);
    },
  };
}
