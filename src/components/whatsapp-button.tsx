import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { whatsappLink, WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * WhatsApp's own glyph. Lucide has no brand marks, and WhatsApp is recognised
 * by its silhouette — a generic chat bubble would not read as WhatsApp.
 */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.17.2-.35.22-.64.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.57-.35z" />
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.87 9.87 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23z" />
    </svg>
  );
}

/**
 * Floating WhatsApp entry point.
 *
 * In the UAE, WhatsApp is often the first channel a customer reaches for on a
 * service business — ahead of a phone call and well ahead of a form. This is
 * a plain deep link, so it works with no integration and no approval.
 *
 * Deliberately appears after a short delay and above the fold's fold, so it
 * does not cover hero content on first paint.
 */
export function WhatsAppButton({
  message = WHATSAPP_MESSAGES.general(),
  className,
}: {
  message?: string;
  className?: string;
}) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { surface: "floating" })}
      aria-label="Message us on WhatsApp"
      className={cn(
        "whatsapp-fab group fixed bottom-5 right-5 z-40 inline-flex items-center gap-3 rounded-full",
        "bg-[#25D366] py-3.5 pl-4 pr-4 text-white shadow-lift",
        "transition-[transform,opacity,padding] duration-[var(--dur-slow)] ease-out",
        "hover:pr-5 focus-visible:outline-2 focus-visible:outline-offset-2",
        "sm:bottom-7 sm:right-7",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      <WhatsAppGlyph className="size-6 shrink-0" />
      {/* Label expands on hover so the resting state stays a compact dot. */}
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-[max-width,opacity] duration-[var(--dur-slow)] ease-out group-hover:max-w-[10rem] group-hover:opacity-100">
        Chat on WhatsApp
      </span>
    </a>
  );
}

/** Inline variant for placing next to a phone number or CTA row. */
export function WhatsAppLink({
  message,
  children,
  className,
  surface = "inline",
}: {
  message?: string;
  children?: React.ReactNode;
  className?: string;
  surface?: string;
}) {
  return (
    <a
      href={whatsappLink(message ?? WHATSAPP_MESSAGES.general())}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track("whatsapp_click", { surface })}
      className={cn(
        "inline-flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-80",
        className,
      )}
    >
      <WhatsAppGlyph className="size-4 shrink-0 text-[#25D366]" />
      {children ?? "WhatsApp"}
    </a>
  );
}
