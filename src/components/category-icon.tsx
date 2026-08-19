import { cn } from "@/lib/utils";

/**
 * Bespoke iconography for the nine booking categories.
 *
 * Drawn rather than pulled from an icon set so the marks share one geometry:
 * a 32-unit grid, 1.6 stroke, round joins, and a single red accent detail per
 * icon that ties back to the logo. At 32-40px these read far more sharply
 * than a downscaled photograph, and each is about a kilobyte.
 *
 * `currentColor` carries the brand green; the accent uses `--accent-soft` so
 * it holds up on both the light tile and the dark brand ground.
 */

type IconProps = { className?: string };

const S = {
  fill: "none",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ACCENT = "var(--accent)";

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-full", className)}
      stroke="currentColor"
      aria-hidden
      focusable="false"
      {...S}
    >
      {children}
    </svg>
  );
}

/** Home cleaning — a house with a polished-surface glint. */
function HomeCleaning(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 14.5 16 6l11 8.5" />
      <path d="M7.5 13v12h17V13" />
      <path d="M13 25v-6.5h6V25" />
      <path d="M21.5 9.5V6.5" stroke={ACCENT} />
      <path d="M23 11h3M20 11h-1.5" stroke={ACCENT} />
    </Svg>
  );
}

/** Single rooms — a doorway with a bucket. */
function SingleRooms(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 5h12v22H7z" />
      <path d="M15.5 16.2v.1" strokeWidth={2.2} />
      <path d="M22 17h6l-1 8h-4l-1-8Z" stroke={ACCENT} />
      <path d="M23 17v-1.5a2 2 0 0 1 4 0V17" stroke={ACCENT} />
    </Svg>
  );
}

/** Soft furnishing — a sofa in plan-elevation. */
function SoftFurnishing(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M6 19v-5a2.5 2.5 0 0 1 5 0v3" />
      <path d="M26 19v-5a2.5 2.5 0 0 0-5 0v3" />
      <path d="M11 17h10" />
      <path d="M4.5 19h23v5.5h-23z" />
      <path d="M8 24.5V27M24 24.5V27" />
      <path d="M16 9.5V6.5M13 8l-1-1.5M19 8l1-1.5" stroke={ACCENT} />
    </Svg>
  );
}

/** Curtains & linen — a pair of drapes on a rail. */
function CurtainsLinen(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5 7h22" />
      <path d="M9 7v19c3.2-1.2 4.6-4.4 4.6-9.5S12.2 8.2 9 7Z" />
      <path d="M23 7v19c-3.2-1.2-4.6-4.4-4.6-9.5S19.8 8.2 23 7Z" />
      <path d="M16 12.5v7" stroke={ACCENT} />
    </Svg>
  );
}

/** Pest control — a shield with a spray nozzle. */
function PestControl(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M16 4.5 6.5 8v7.5c0 6 4 10.4 9.5 12 5.5-1.6 9.5-6 9.5-12V8L16 4.5Z" />
      <path d="M12.5 15.5 15 18l5-5" stroke={ACCENT} strokeWidth={2} />
    </Svg>
  );
}

/** Windows & glass — a pane with a squeegee stroke. */
function WindowsGlass(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M5.5 5.5h21v21h-21z" />
      <path d="M16 5.5v21M5.5 16h21" />
      <path d="m20 10-8 8" stroke={ACCENT} strokeWidth={2.2} />
      <path d="m22.5 8.2-1.6 1.6" stroke={ACCENT} strokeWidth={2.2} />
    </Svg>
  );
}

/** Floor care — tiled floor in perspective with a shine. */
function FloorCare(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M4 25.5 11 12h10l7 13.5z" />
      <path d="M8.6 17.5h14.8M6.3 21.5h19.4M16 12v13.5" />
      <path d="M16 8.5V5.5M12.5 8l-1.2-2M19.5 8l1.2-2" stroke={ACCENT} />
    </Svg>
  );
}

/** Water tank — a cylindrical tank with a droplet. */
function WaterTank(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M7 9.5c0-2 4-3.5 9-3.5s9 1.5 9 3.5v13c0 2-4 3.5-9 3.5s-9-1.5-9-3.5z" />
      <path d="M7 9.5c0 2 4 3.5 9 3.5s9-1.5 9-3.5" />
      <path
        d="M16 17c-1.6 1.9-2.6 3.3-2.6 4.4a2.6 2.6 0 0 0 5.2 0c0-1.1-1-2.5-2.6-4.4Z"
        stroke={ACCENT}
      />
    </Svg>
  );
}

/** Maintenance — a wrench crossed with a screwdriver. */
function Maintenance(p: IconProps) {
  return (
    <Svg {...p}>
      <path d="M20.4 5.8a5.5 5.5 0 0 0-6.6 7.2L6 20.8 9.6 24.4l7.8-7.8a5.5 5.5 0 0 0 7.2-6.6l-3.2 3.2-3-.8-.8-3z" />
      <path d="M8.8 21.6 7.6 22.8" stroke={ACCENT} strokeWidth={2.2} />
    </Svg>
  );
}

const ICONS = {
  "home-cleaning": HomeCleaning,
  "room-cleaning": SingleRooms,
  "soft-furnishing": SoftFurnishing,
  "curtains-linen": CurtainsLinen,
  "pest-control": PestControl,
  "windows-glass": WindowsGlass,
  "floor-care": FloorCare,
  "water-tank": WaterTank,
  maintenance: Maintenance,
} as const;

export type CategoryIconKey = keyof typeof ICONS;

export function hasCategoryIcon(slug: string): slug is CategoryIconKey {
  return slug in ICONS;
}

/**
 * Renders the icon inside its branded tile. The tile carries a soft brand
 * wash and a hairline so the mark has a home without becoming a heavy card.
 */
export function CategoryIcon({
  slug,
  className,
  tone = "light",
}: {
  slug: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  const Icon = hasCategoryIcon(slug) ? ICONS[slug] : null;
  if (!Icon) return null;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-xl border transition-colors duration-[var(--dur-base)]",
        tone === "light"
          ? "border-primary/12 bg-[linear-gradient(140deg,color-mix(in_oklab,var(--primary)_11%,transparent),color-mix(in_oklab,var(--primary)_3%,transparent))] text-primary"
          : "border-primary-foreground/15 bg-primary-foreground/[0.06] text-primary-foreground",
        className,
      )}
    >
      <Icon className="size-[62%]" />
    </span>
  );
}
