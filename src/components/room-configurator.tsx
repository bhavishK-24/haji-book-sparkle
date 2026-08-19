import { Camera, Info } from "lucide-react";
import { ChoiceCards, CountStepper } from "@/components/choice-cards";
import { Button } from "@/components/ui/button";
import {
  BATHROOM_QUESTIONS,
  CONDITION_CHANGE_POLICY,
  KITCHEN_QUESTIONS,
  NOT_SURE_POLICY,
  PHOTO_LOCK_OFFER,
} from "@/data/configured/engine";
import type {
  BathroomSelection,
  CleanRecency,
  DoorBand,
  KitchenSelection,
  ScaleLevel,
} from "@/data/configured/types";
import { WHATSAPP_MESSAGES, whatsappLink } from "@/lib/whatsapp";

/**
 * The room questions for Kitchen and Bathroom Intense Deep Cleaning.
 *
 * Questions only — the running price lives in the page's single price panel,
 * so there is one place on the screen showing a total rather than two that can
 * disagree with each other.
 *
 * Every question asks for something the customer can *observe*: how many
 * cabinet doors, whether there is a bathtub, when the oven was last cleaned.
 * None of them asks the customer to grade their own dirt, because self-reported
 * severity is unreliable in one direction — everybody under-reports.
 */

/** The promise that makes a self-described condition safe to rely on. */
function ConditionPolicy() {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-secondary/50 p-4">
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="text-sm font-semibold">{CONDITION_CHANGE_POLICY.heading}</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {CONDITION_CHANGE_POLICY.body}
        </p>
      </div>
    </div>
  );
}

export function KitchenConfigurator({
  selection,
  onChange,
}: {
  selection: KitchenSelection;
  onChange: (next: KitchenSelection) => void;
}) {
  const [doors, appliances, lastCleaned] = KITCHEN_QUESTIONS;

  return (
    <div className="space-y-10">
      <ChoiceCards
        question={doors!}
        value={selection.doorBand ? [selection.doorBand] : []}
        onChange={(next) => onChange({ ...selection, doorBand: (next[0] ?? null) as DoorBand })}
      />
      <ChoiceCards
        question={appliances!}
        value={selection.appliances}
        onChange={(next) => onChange({ ...selection, appliances: next })}
      />
      <ChoiceCards
        question={lastCleaned!}
        value={selection.lastCleaned ? [selection.lastCleaned] : []}
        onChange={(next) =>
          onChange({ ...selection, lastCleaned: (next[0] ?? null) as CleanRecency })
        }
      />

      {/* Two photographs remove the main cause of on-site re-quoting. */}
      <div className="rounded-xl border border-primary/25 bg-primary/[0.03] p-4">
        <p className="text-sm font-semibold">{PHOTO_LOCK_OFFER.ask}</p>
        <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {PHOTO_LOCK_OFFER.reward}
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <a href={whatsappLink(WHATSAPP_MESSAGES.quote("Kitchen Intense Deep Cleaning"))}>
            <Camera className="size-3.5" aria-hidden />
            Send photos
          </a>
        </Button>
      </div>

      <ConditionPolicy />
    </div>
  );
}

export function BathroomConfigurator({
  selection,
  onChange,
}: {
  selection: BathroomSelection;
  onChange: (next: BathroomSelection) => void;
}) {
  const [count, tubs, enclosures, scale] = BATHROOM_QUESTIONS;
  const n = selection.bathrooms ?? 1;

  return (
    <div className="space-y-10">
      <CountStepper
        question={count!}
        value={n}
        onChange={(next) =>
          onChange({
            ...selection,
            bathrooms: next,
            /* Fixture counts can never exceed the rooms being cleaned. */
            bathtubs: Math.min(selection.bathtubs, next),
            glassEnclosures: Math.min(selection.glassEnclosures, next),
          })
        }
      />
      <CountStepper
        question={{ ...tubs!, max: n }}
        value={selection.bathtubs}
        onChange={(next) => onChange({ ...selection, bathtubs: next })}
      />
      <CountStepper
        question={{ ...enclosures!, max: n }}
        value={selection.glassEnclosures}
        onChange={(next) => onChange({ ...selection, glassEnclosures: next })}
      />
      <ChoiceCards
        question={scale!}
        value={selection.scale ? [selection.scale] : []}
        onChange={(next) => onChange({ ...selection, scale: (next[0] ?? null) as ScaleLevel })}
      />

      {selection.scale === "not-sure" ? (
        <p className="rounded-xl border border-border bg-secondary/50 p-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
          {NOT_SURE_POLICY}
        </p>
      ) : null}

      <ConditionPolicy />
    </div>
  );
}
