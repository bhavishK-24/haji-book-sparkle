import { COMPANY } from "@/lib/company";

/**
 * WhatsApp deep links — the only WhatsApp capability that works today.
 *
 * This is a *link builder*, deliberately separate from
 * `src/lib/notifications`. Opening wa.me in the customer's browser needs no
 * API, no credentials and no approval. Sending templated messages from the
 * business needs the WhatsApp Business Platform, and that lives behind the
 * channel adapter instead.
 *
 * Keeping the two apart means the "message us" button ships now, and the
 * automated notifications arrive later without touching this file.
 */

/** wa.me requires digits only — no +, spaces or dashes. */
const toWaNumber = (raw: string) => raw.replace(/\D/g, "");

export const WHATSAPP_NUMBER = toWaNumber(COMPANY.whatsapp);

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Pre-filled openers.
 *
 * Each starts with what the customer wants so the coordinator can act on the
 * first message without a round trip. Kept short — WhatsApp truncates long
 * prefills in the compose box and people delete what they have to scroll.
 */
export const WHATSAPP_MESSAGES = {
  general: () => `Hello ${COMPANY.shortName}, I'd like to ask about your cleaning services.`,

  service: (serviceName: string) =>
    `Hello ${COMPANY.shortName}, I'd like to enquire about ${serviceName}.`,

  quote: (serviceName: string) =>
    `Hello ${COMPANY.shortName}, I'd like a quote for ${serviceName}.`,

  /**
   * Opener for the services quoted from a video.
   *
   * Says the video is coming so the coordinator knows to wait for it rather
   * than replying with the questions the video is meant to replace.
   */
  videoQuote: (serviceName: string) =>
    `Hello ${COMPANY.shortName}, I'd like a price for ${serviceName}. I'm sending a short video of the space now.`,

  /**
   * Sent after a booking is submitted, so a customer who prefers WhatsApp can
   * continue the conversation with the reference already attached.
   */
  booking: (reference: string, serviceName: string, date: string) =>
    `Hello ${COMPANY.shortName}, this is about my booking ${reference} — ${serviceName} on ${date}.`,
} as const;
