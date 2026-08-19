import { Check, Minus, Plus } from "lucide-react";
import { ALL_PHOTOS, type Photo } from "@/data/media";
import { ServicePhoto } from "@/components/service-photo";
import type { ChoiceOption, ChoiceQuestion } from "@/data/configured/types";
import { cn } from "@/lib/utils";

/**
 * Selection cards for the room configurators.
 *
 * Every option can carry a reference photograph, because "match your kitchen
 * to this picture" is a question a customer can answer accurately and "how
 * many cabinet doors do you have?" is not.
 *
 * Cards without a photograph render as clean text rather than showing a
 * placeholder. Photos arrive per option, so the grid has to look deliberate
 * either way and while only some are filled in.
 */

/**
 * Resolves an option's image key against the photo manifest.
 *
 * Returns null for an unknown key rather than throwing: a reference photo that
 * has not been added yet should leave a clean text card, not break the page.
 */
function photoFor(option: ChoiceOption): Photo | null {
  if (!option.image) return null;
  return (ALL_PHOTOS as Record<string, Photo>)[option.image] ?? null;
}

function Card({
  option,
  selected,
  multiple,
  onToggle,
}: {
  option: ChoiceOption;
  selected: boolean;
  multiple: boolean;
  onToggle: () => void;
}) {
  const photo = photoFor(option);

  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all duration-[var(--dur-base)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
        selected
          ? "border-primary bg-primary/[0.05] shadow-soft"
          : "border-border hover:border-primary/40 hover:bg-secondary/60",
      )}
    >
      {photo ? (
        <span className="block overflow-hidden border-b border-border">
          <ServicePhoto photo={photo} aspect="aspect-4/3" sizes="(max-width: 640px) 45vw, 15rem" />
        </span>
      ) : null}

      <span className="flex flex-1 items-start gap-2.5 p-4">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 grid size-[1.125rem] shrink-0 place-items-center border transition-colors duration-[var(--dur-base)]",
            multiple ? "rounded-[0.3rem]" : "rounded-full",
            selected ? "border-primary bg-primary text-primary-foreground" : "border-foreground/25",
          )}
        >
          {selected ? <Check className="size-3" strokeWidth={3.5} /> : null}
        </span>
        <span className="min-w-0">
          <span className="block text-[0.9375rem] font-semibold leading-snug">{option.label}</span>
          {option.caption ? (
            <span className="mt-1 block text-[0.8125rem] leading-snug text-muted-foreground">
              {option.caption}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function ChoiceCards({
  question,
  value,
  onChange,
}: {
  question: ChoiceQuestion;
  /** Chosen option ids. Single-choice questions carry at most one. */
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const multiple = question.kind === "multiple";
  /* Cards carry photos, so they need more room than plain chips. */
  const anyPhoto = question.options.some((o) => o.image);

  const toggle = (id: string) => {
    if (!multiple) return onChange([id]);
    /* "None of these" is exclusive with everything else, in both directions. */
    if (id === "none") return onChange(value.includes("none") ? [] : ["none"]);
    const without = value.filter((v) => v !== "none");
    onChange(without.includes(id) ? without.filter((v) => v !== id) : [...without, id]);
  };

  return (
    <fieldset>
      <legend className="text-[1.0625rem] font-semibold leading-snug">{question.question}</legend>
      {question.help ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{question.help}</p>
      ) : null}
      <div
        role={multiple ? "group" : "radiogroup"}
        className={cn(
          "mt-4 grid gap-3",
          anyPhoto ? "grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {question.options.map((o) => (
          <Card
            key={o.id}
            option={o}
            selected={value.includes(o.id)}
            multiple={multiple}
            onToggle={() => toggle(o.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Numeric stepper for "how many?" questions.
 *
 * A stepper rather than a text input because every one of these counts is a
 * small integer, and because it cannot produce a value outside its range.
 */
export function CountStepper({
  question,
  value,
  onChange,
}: {
  question: ChoiceQuestion;
  value: number;
  onChange: (next: number) => void;
}) {
  const min = question.min ?? 0;
  const max = question.max ?? 10;
  const noun = question.unitNoun ?? "item";

  return (
    <fieldset>
      <legend className="text-[1.0625rem] font-semibold leading-snug">{question.question}</legend>
      {question.help ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{question.help}</p>
      ) : null}
      <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-border p-1">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`One fewer ${noun}`}
          className="grid size-10 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <output className="min-w-14 text-center font-display text-xl font-bold tabular-nums">
          {value}
        </output>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`One more ${noun}`}
          className="grid size-10 place-items-center rounded-full transition-colors duration-[var(--dur-base)] hover:bg-secondary disabled:opacity-35 disabled:hover:bg-transparent"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </fieldset>
  );
}
