import { cn } from "@/lib/utils";
import type { Photo } from "@/data/media";

/**
 * Responsive photograph with a WebP source and a JPEG fallback.
 *
 * `sizes` matters more than usual here: the originals are only 900-960px
 * wide, so serving the largest rendition into a small card wastes bandwidth
 * while serving a small one into the hero looks soft.
 */
export function ServicePhoto({
  photo,
  sizes,
  className,
  priority = false,
  aspect,
  fill = false,
}: {
  photo: Photo;
  sizes: string;
  className?: string;
  /** Set on the LCP image only. */
  priority?: boolean;
  /**
   * Tailwind aspect utility, e.g. "aspect-4/5". Ignored when `fill` is set.
   *
   * Defaults to "auto", which picks a frame that suits the source: a gentle
   * 4:5 for portrait photos and 3:2 for landscape ones. Forcing a tall phone
   * photo into a 3:2 box throws away roughly three-quarters of its height,
   * which is what made subjects look sliced off mid-body.
   */
  aspect?: string | "auto";
  /**
   * Render as a background layer that fills its positioned ancestor.
   *
   * Without this, passing `absolute inset-0` through `className` positioned
   * the *image* but left the `<picture>` in normal flow still carrying its
   * aspect box — a full-width 3:2 phantom that added ~900px of empty height
   * to the section and stretched it for no visible reason. With `fill` the
   * picture itself becomes the positioned layer and the frame is dropped, so
   * the photo simply crops to whatever the section turns out to be.
   */
  fill?: boolean;
}) {
  const frame = fill
    ? null
    : aspect === "auto" || aspect === undefined
      ? photo.orientation === "portrait"
        ? "aspect-4/5"
        : "aspect-3/2"
      : aspect;

  return (
    <picture
      className={cn("block overflow-hidden", frame, fill ? cn("size-full", className) : undefined)}
    >
      <source type="image/webp" srcSet={photo.srcSet} sizes={sizes} />
      <img
        src={photo.fallback}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        // Focal point keeps the subject in frame when a tall photo is cropped
        // into a wide box; without it the crop lands mid-torso.
        style={photo.focal ? { objectPosition: photo.focal } : undefined}
        className={cn("size-full object-cover", fill ? undefined : className)}
      />
    </picture>
  );
}
