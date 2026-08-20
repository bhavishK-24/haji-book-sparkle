/**
 * Generates `public/sitemap.xml`.
 *
 *   node scripts/build-sitemap.mjs
 *
 * The booking category pages are read from `src/data/booking-categories.ts`
 * rather than listed by hand: the set is finite and known, but it has changed
 * several times, and a sitemap that quietly omits a new category is worse than
 * no sitemap — Google keeps crawling the old shape and never finds the new one.
 *
 * Everything else is an explicit list, because those routes are deliberate
 * choices rather than data. Adding a route does NOT automatically add it here;
 * that is the point. Intermediate booking steps, the staff login and the admin
 * dashboard must never appear, and an automatic sweep of the route tree would
 * pick them all up.
 *
 * Output is generated — edit this script, never the XML.
 */
import { readFileSync, writeFileSync } from "node:fs";

/** Canonical origin. The apex, never www: www 301s here. */
const ORIGIN = "https://hajiahliclean.com";
const OUT = "public/sitemap.xml";

/**
 * Static public routes, with the priority each deserves relative to the others.
 *
 * `priority` is a hint about relative importance within this site, not a
 * ranking lever — Google treats it loosely. The ordering here reflects what
 * actually earns a visit: the homepage, then the catalogue and the booking
 * entry point, then the individual category pages, then legal.
 */
const STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "weekly" },
  { path: "/services", priority: "0.9", changefreq: "weekly" },
  { path: "/book", priority: "0.9", changefreq: "weekly" },
  { path: "/business", priority: "0.8", changefreq: "monthly" },
];

/** Legal pages: real, indexable, but never the reason someone arrives. */
const LEGAL_ROUTES = [
  { path: "/terms", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/cancellation", priority: "0.4", changefreq: "yearly" },
];

/**
 * Routes that must never be listed, kept here as an explicit record rather
 * than as an absence. If someone later automates this from the route tree,
 * this list is the thing to filter against.
 *
 *   /book/$category/extras     intermediate step, needs prior state
 *   /book/$category/schedule   intermediate step, needs prior state
 *   /book/$category/details    checkout form
 *   /auth                      staff login
 *   /_authenticated/admin      admin dashboard, behind a route guard
 */

/** Reads the booking category slugs straight from the data module. */
function bookingCategorySlugs() {
  const source = readFileSync("src/data/booking-categories.ts", "utf8");
  const slugs = [...source.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
  if (slugs.length === 0)
    throw new Error("No booking category slugs found — did the shape change?");
  return slugs;
}

const urls = [
  ...STATIC_ROUTES,
  ...bookingCategorySlugs().map((slug) => ({
    path: `/book/${slug}`,
    priority: "0.8",
    changefreq: "weekly",
  })),
  ...LEGAL_ROUTES,
];

/* A duplicate would be a bug in the lists above, not something to silently dedupe. */
const seen = new Set();
for (const u of urls) {
  if (seen.has(u.path)) throw new Error(`Duplicate path in sitemap: ${u.path}`);
  seen.add(u.path);
}

/** Dates are date-only; a timestamp implies a precision we do not have. */
const lastmod = new Date().toISOString().slice(0, 10);

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map((u) =>
    [
      "  <url>",
      `    <loc>${ORIGIN}${u.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <changefreq>${u.changefreq}</changefreq>`,
      `    <priority>${u.priority}</priority>`,
      "  </url>",
    ].join("\n"),
  ),
  "</urlset>",
  "",
].join("\n");

writeFileSync(OUT, xml, "utf8");

console.log(`${OUT} — ${urls.length} URLs, lastmod ${lastmod}`);
for (const u of urls) console.log(`  ${ORIGIN}${u.path}`);
