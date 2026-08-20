import { COMPANY } from "./company";

/**
 * Canonical URLs and structured data.
 *
 * One origin, defined once. Every canonical, and every URL inside the
 * structured data, is built from it — so there is no route that can quietly
 * publish a www address after the apex/www redirect made www the wrong answer.
 */

/** The canonical origin. Apex, HTTPS, no trailing slash. www 301s to this. */
export const SITE_ORIGIN = "https://hajiahliclean.com";

/**
 * The canonical URL for a path.
 *
 * Deliberately takes only the pathname. The booking flow carries its state in
 * the query string — `?service=`, `?size=`, `?items=`, `?room=` — and each
 * combination would otherwise look to Google like a separate page competing
 * with the others. Canonicalising to the bare path collapses them all onto the
 * one URL that belongs in the index.
 *
 * A trailing slash is stripped everywhere except the root, so `/services` and
 * `/services/` cannot both be claimed as canonical.
 */
export function canonicalUrl(pathname: string): string {
  const path = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (path === "" || path === "/") return `${SITE_ORIGIN}/`;
  const trimmed = path.endsWith("/") ? path.slice(0, -1) : path;
  return `${SITE_ORIGIN}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

/**
 * Opening hours, split out of the human-readable string in `company.ts`.
 *
 * `COMPANY.hours` reads "Every day, 8:00 – 19:00" — true, but not machine
 * readable. These are the same figures in the shape schema.org expects, and
 * they match the arrival slots the booking flow actually offers.
 */
const OPENING_HOURS = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  opens: "08:00",
  closes: "19:00",
};

/**
 * LocalBusiness structured data.
 *
 * Built ONLY from facts already verified in `company.ts` — the registered
 * entity, the trade-licence address, the contact details, the TRN and the year
 * the business started. Nothing here is estimated or filled in for
 * completeness.
 *
 * Deliberately absent, because none of it is verified in this repository:
 *   aggregateRating / review   no review data exists on the site
 *   geo                        no surveyed coordinates
 *   sameAs                     no confirmed social profiles
 *   priceRange                 prices vary by service and change with the workbook
 *   areaServed                 only Dubai is recorded; wider coverage is marketing copy
 *
 * Marking up any of those would be structured-data spam, and a rating we
 * cannot evidence risks losing rich results altogether.
 */
export function localBusinessJsonLd(): string {
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_ORIGIN}/#business`,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    url: `${SITE_ORIGIN}/`,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    /* UAE VAT registration number. */
    vatID: COMPANY.trn,
    foundingDate: String(COMPANY.established),
    address: {
      "@type": "PostalAddress",
      streetAddress: "201 - Saeed Juma Khalifa Al Mehairi Building, Street 14A, Frij Al Murar",
      addressLocality: "Deira, Dubai",
      addressRegion: COMPANY.emirate,
      addressCountry: "AE",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: OPENING_HOURS.days,
        opens: OPENING_HOURS.opens,
        closes: OPENING_HOURS.closes,
      },
    ],
  };

  /*
   * `</script>` inside a JSON string would close the tag early. No current
   * value contains one, but the data comes from an editable module.
   */
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
