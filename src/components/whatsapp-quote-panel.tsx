import { MessageCircle, PhoneCall, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAed, priceFrom } from "@/data/pricing";
import { COMPANY } from "@/lib/company";
import { WHATSAPP_MESSAGES, whatsappLink } from "@/lib/whatsapp";
import type { Service } from "@/data";

/**
 * Booking panel for services quoted from a short video.
 *
 * Kitchen and bathroom deep cleans vary far more than a whole-home clean does —
 * the same "standard bathroom" can be a ten-minute wipe or an afternoon of
 * descaling, and a customer cannot reliably grade that themselves. Twenty
 * seconds of video answers it in a way no set of questions can, and it means
 * the price we give is the price they pay.
 *
 * The panel shows the entry price so the customer is not walking into an
 * unknown, then hands off to WhatsApp. No configurator, no self-assessment.
 */
export function WhatsAppQuotePanel({ service }: { service: Service }) {
  const from = priceFrom(service.id);
  const tel = COMPANY.phone.replace(/\s/g, "");

  /* What we need in the video, per room. Specific beats "send a video". */
  const shotList =
    service.id === "SVC-104"
      ? [
          "A slow pan across the whole kitchen",
          "The hob and extractor hood close up",
          "One cabinet opened, inside and out",
        ]
      : [
          "A slow pan across the whole bathroom",
          "The shower glass and taps close up",
          "The grout and any corners you are worried about",
        ];

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Quoted from a short video
      </p>

      {from ? (
        <>
          <p className="mt-4 font-display text-3xl font-bold tabular-nums">
            From {formatAed(from.exclusive)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            + {(from.vat / from.exclusive) * 100}% VAT · final price confirmed on WhatsApp
          </p>
        </>
      ) : (
        <p className="mt-4 font-display text-2xl font-bold">Price on quote</p>
      )}

      <div className="mt-6 rounded-xl border border-border bg-secondary/40 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Video className="size-4 shrink-0 text-primary" aria-hidden />
          Send us a 20-second video
        </p>
        <ul className="mt-2.5 space-y-1.5 text-[0.8125rem] leading-snug text-muted-foreground">
          {shotList.map((shot) => (
            <li key={shot} className="flex gap-2">
              <span aria-hidden className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-primary" />
              {shot}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted-foreground">
          We reply with a fixed price and the next available slot. No on-site adjustment afterwards
          — the price we quote from the video is the price you pay.
        </p>
      </div>

      <div className="mt-5 grid gap-2.5">
        <Button asChild variant="accent" size="lg" className="w-full">
          <a href={whatsappLink(WHATSAPP_MESSAGES.videoQuote(service.name))}>
            <MessageCircle className="size-4" aria-hidden />
            Send video on WhatsApp
          </a>
        </Button>
        <Button asChild variant="outline" size="lg" className="w-full">
          <a href={`tel:${tel}`}>
            <PhoneCall className="size-4" aria-hidden />
            {COMPANY.phone}
          </a>
        </Button>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        {COMPANY.hours}. We usually reply within the hour.
      </p>
    </div>
  );
}
