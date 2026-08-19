import commercialTank from "@/assets/commercial-tank.jpg";
import heroLobby from "@/assets/hero-lobby.jpg";
import heroCleaning from "@/assets/hero-cleaning.jpg";
import residentialVilla from "@/assets/residential-villa.jpg";

/**
 * Central image manifest.
 *
 * Every photograph on the site is referenced through this file so that
 * swapping placeholder art for real photography is a one-line change per
 * slot rather than a hunt through components.
 *
 * ── Replacing a placeholder ───────────────────────────────────────────────
 * 1. Drop the real photo into `src/assets/` using the filename in `file`.
 * 2. Add an import at the top of this file.
 * 3. Point the slot's `src` at that import and update `alt` to describe the
 *    actual photograph.
 *
 * `alt` text must describe what is genuinely in the frame — it is read aloud
 * by screen readers and indexed by search engines, so it cannot describe a
 * photo that is not there.
 */
export type MediaSlot = {
  src: string;
  alt: string;
  /** Filename to use when dropping the real photograph in. */
  file: string;
  /** True once real company photography has replaced the placeholder. */
  isPlaceholder: boolean;
};

export const MEDIA = {
  /** Hero — exterior glass facade cleaning with an extension pole. */
  hero: {
    src: heroLobby,
    alt: "Haji Ahli technician cleaning a glass office facade with an extension pole",
    file: "hero-facade.jpg",
    isPlaceholder: true,
  },

  /** Residential track — interior detailing in a finished villa. */
  residential: {
    src: residentialVilla,
    alt: "Uniformed cleaner detailing a marble console table in a finished Dubai villa",
    file: "work-villa-interior.jpg",
    isPlaceholder: true,
  },

  /** Commercial track — high-level access work on a commercial building. */
  commercial: {
    src: commercialTank,
    alt: "Technician in a hard hat and hi-vis vest cleaning high-level glazing from a ladder",
    file: "work-highrise.jpg",
    isPlaceholder: true,
  },

  /** Capability strip — floor-to-ceiling glass cleaned from inside. */
  glass: {
    src: heroCleaning,
    alt: "Cleaner working on floor-to-ceiling glazing inside a marble-floored villa",
    file: "work-interior-glass.jpg",
    isPlaceholder: true,
  },

  /** Capability strip — villa exterior window cleaning. */
  villaExterior: {
    src: residentialVilla,
    alt: "Two-person crew cleaning upper-floor villa windows from a ladder",
    file: "work-villa-exterior.jpg",
    isPlaceholder: true,
  },

  /** Capability strip — commercial carpet extraction. */
  carpet: {
    src: commercialTank,
    alt: "Crew running rotary and extraction machines across a warehouse carpet",
    file: "work-commercial-carpet.jpg",
    isPlaceholder: true,
  },
} satisfies Record<string, MediaSlot>;
