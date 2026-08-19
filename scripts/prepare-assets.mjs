/**
 * One-off asset preparation.
 *
 *   node scripts/prepare-assets.mjs
 *
 * Reads the originals in `haji_ahli_assets/` and writes web-ready derivatives
 * into `src/assets/`. Safe to re-run; output is deterministic.
 *
 * Logo: the supplied PNG is 1254x1254 RGB with no alpha channel, so its
 * background is opaque white and it cannot sit on a dark surface. We remove
 * the white matte, un-premultiply the edge pixels so anti-aliasing does not
 * leave a pale halo, trim the surrounding whitespace, and emit sized PNGs.
 */
import { mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = "haji_ahli_assets";
const OUT_PHOTOS = "src/assets/photos";
const OUT_BRAND = "src/assets/brand";

mkdirSync(OUT_PHOTOS, { recursive: true });
mkdirSync(OUT_BRAND, { recursive: true });

/** Photo key -> source filename, plus any crop needed before publication. */
const PHOTOS = [
  { key: "facade-glass-pole", file: "WhatsApp Image 2026-08-07 at 7.33.11 PM.jpeg" },
  { key: "hospitality-floor-detail", file: "WhatsApp Image 2026-08-07 at 7.33.11 PM (1).jpeg" },
  { key: "villa-console-detail", file: "WhatsApp Image 2026-08-07 at 7.33.12 PM.jpeg" },
  { key: "ladder-high-level-access", file: "WhatsApp Image 2026-08-07 at 7.34.25 PM.jpeg" },
  { key: "interior-glass-pole", file: "WhatsApp Image 2026-08-07 at 7.34.27 PM.jpeg" },
  { key: "carpet-extraction", file: "WhatsApp Image 2026-08-07 at 7.39.02 PM.jpeg" },
  {
    key: "villa-exterior-windows",
    file: "WhatsApp Image 2026-08-07 at 7.39.27 PM.jpeg",
    // Burnt-in "AI CAMERA / Shot on realme C11 2021" watermark and a
    // "2025/12/24" timestamp occupy the bottom strip. Crop them off.
    cropBottom: 150,
  },
  // ── Second batch ────────────────────────────────────────────────────────
  {
    key: "water-tank-plantroom",
    file: "WhatsApp Image 2026-08-10 at 10.40.03 PM.jpeg",
  },
  {
    key: "curtain-steam-clean",
    file: "WhatsApp Image 2026-08-10 at 10.43.14 PM.jpeg",
  },
  {
    key: "carpet-shampoo-residence",
    file: "WhatsApp Image 2026-08-11 at 7.36.48 AM.jpeg",
  },
  {
    key: "carpet-shampoo-bedroom",
    file: "WhatsApp Image 2026-08-11 at 7.36.46 AM.jpeg",
  },
  // ── Third batch ─────────────────────────────────────────────────────────
  {
    key: "marble-floor-polish",
    file: "WhatsApp Image 2026-08-10 at 10.20.39 PM.jpeg",
    // Same realme watermark and timestamp strip as the other outdoor shot.
    cropBottom: 130,
  },
  {
    key: "post-construction-vacuum",
    file: "WhatsApp Image 2026-08-10 at 7.51.35 PM.jpeg",
  },
  // ── Generated set ───────────────────────────────────────────────────────
  // Commissioned imagery for the services with no usable photograph. Same
  // uniform, same lighting treatment, so they sit alongside the real photos.
  { key: "balcony-cleaning", file: "ChatGPT Image Aug 12, 2026, 03_47_53 PM.png" },
  { key: "bathroom-cleaning", file: "ChatGPT Image Aug 12, 2026, 03_47_56 PM.png" },
  { key: "kitchen-cleaning", file: "ChatGPT Image Aug 12, 2026, 03_47_59 PM.png" },
  { key: "painting-service", file: "ChatGPT Image Aug 12, 2026, 03_50_53 PM.png" },
  { key: "tiling-service", file: "ChatGPT Image Aug 12, 2026, 03_51_56 PM.png" },
  { key: "plumbing-service", file: "ChatGPT Image Aug 12, 2026, 03_53_00 PM.png" },
  { key: "carpentry-service", file: "ChatGPT Image Aug 12, 2026, 03_54_02 PM.png" },
  { key: "sofa-extraction", file: "ChatGPT Image Aug 12, 2026, 03_58_01 PM.png" },
  { key: "office-waste-round", file: "ChatGPT Image Aug 12, 2026, 04_02_18 PM.png" },
  { key: "office-glass-door", file: "ChatGPT Image Aug 12, 2026, 04_02_54 PM.png" },
  { key: "pest-control-spray", file: "ChatGPT Image Aug 12, 2026, 02_26_58 PM.png" },
  { key: "curtain-steam-service", file: "ChatGPT Image Aug 12, 2026, 05_48_35 PM.png" },
];

/**
 * Derivative widths. The largest is the source's own width (capped at 960) so
 * every photo always gets a full-size rendition — the portrait originals are
 * 900px wide, and a flat 960 ceiling would silently skip them entirely.
 */
const widthsFor = (naturalWidth) => [...new Set([Math.min(960, naturalWidth), 640, 400])];

async function buildPhotos() {
  const manifest = [];
  for (const { key, file, cropBottom = 0 } of PHOTOS) {
    const input = path.join(SRC, file);
    const meta = await sharp(input).metadata();
    const height = meta.height - cropBottom;

    const widths = widthsFor(meta.width);
    /*
     * The JPEG exists only as the <img> fallback for browsers with no WebP
     * support, and that element takes a single src rather than a srcSet — so
     * only the largest width is ever requested. Emitting a JPEG per width
     * produced 50 files and 2.3 MB that nothing referenced.
     */
    const jpegWidth = Math.max(...widths);

    for (const w of widths) {
      const base = sharp(input)
        .extract({ left: 0, top: 0, width: meta.width, height })
        .resize({ width: w, withoutEnlargement: true });

      await base
        .clone()
        .webp({ quality: 80, effort: 5 })
        .toFile(path.join(OUT_PHOTOS, `${key}-${w}.webp`));

      if (w === jpegWidth) {
        await base
          .clone()
          .jpeg({ quality: 78, mozjpeg: true })
          .toFile(path.join(OUT_PHOTOS, `${key}-${w}.jpg`));
      }
    }
    manifest.push({ key, width: meta.width, height, widths: widthsFor(meta.width) });
    console.log(
      `photo  ${key.padEnd(26)} ${meta.width}x${height}  widths: ${widthsFor(meta.width).join(", ")}`,
    );
  }
  return manifest;
}

/**
 * Remove a white background, recovering edge pixels.
 *
 * For flat artwork composited over white, the observed pixel is
 * `p = c*a + 255*(1-a)`. Alpha is well approximated by how far the darkest
 * channel sits from white, and the true ink colour is then recovered by
 * un-premultiplying. Doing this properly is what stops the mark showing a
 * pale fringe when it is placed on the dark brand background.
 */
async function buildLogo() {
  const input = path.join(SRC, "ChatGPT Image Aug 10, 2026, 10_56_10 AM.png");
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  });

  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, o = 0; i < data.length; i += info.channels, o += 4) {
    const r = data[i],
      g = data[i + 1],
      b = data[i + 2];
    const min = Math.min(r, g, b);
    const a = 1 - min / 255;

    // Treat anything within a couple of levels of pure white as background,
    // so the flat backdrop lands on exactly alpha 0 rather than 1/255.
    if (a <= 0.012) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      continue;
    }
    // Un-premultiply against the white matte.
    out[o] = Math.max(0, Math.min(255, Math.round((r - 255 * (1 - a)) / a)));
    out[o + 1] = Math.max(0, Math.min(255, Math.round((g - 255 * (1 - a)) / a)));
    out[o + 2] = Math.max(0, Math.min(255, Math.round((b - 255 * (1 - a)) / a)));
    out[o + 3] = Math.round(a * 255);
  }

  const transparent = sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 },
  }).trim({ threshold: 1 });

  // Encode to PNG before re-reading: a raw-input pipeline emits raw bytes,
  // which sharp cannot then infer a format from.
  const trimmed = await transparent.png().toBuffer();
  const tMeta = await sharp(trimmed).metadata();

  // PNG only: for flat two-colour artwork with alpha, a palettised PNG beats
  // WebP comfortably (65KB vs 220KB at 512px), so there is nothing to gain.
  for (const w of [512, 256, 128]) {
    await sharp(trimmed)
      .resize({ width: w, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true, quality: 90 })
      .toFile(path.join(OUT_BRAND, `haji-ahli-logo-${w}.png`));
  }
  console.log(`logo   trimmed to ${tMeta.width}x${tMeta.height}, alpha applied`);
}

await buildPhotos();
await buildLogo();

const sizes = readdirSync(OUT_PHOTOS).concat(readdirSync(OUT_BRAND)).length;
console.log(`\nwrote ${sizes} files`);
