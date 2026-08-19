import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * The single source of truth for every button and button-styled link.
 *
 * Pill geometry is the house style, so `rounded-full` lives in the base and
 * variants only ever change colour. Note that `--accent` in this theme is a
 * saturated red-orange used for primary conversion CTAs — it is deliberately
 * NOT the hover colour for neutral variants.
 */
const buttonVariants = cva(
  [
    "inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2",
    "whitespace-nowrap rounded-full font-semibold",
    "transition-[background-color,border-color,color,box-shadow,transform,gap]",
    "duration-[var(--dur-base)] ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--focus-ring)]",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
    "active:translate-y-px",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        /** Brand primary. The default action on light surfaces. */
        default: "bg-primary text-primary-foreground shadow-soft hover:bg-primary-deep",
        /** Highest-emphasis conversion CTA. Use once per view. */
        accent:
          "bg-accent text-accent-foreground shadow-soft hover:shadow-[0_12px_32px_oklch(0.52_0.227_27.5_/_0.34)]",
        /**
         * Neutral bordered action on light surfaces.
         *
         * Tinted rather than transparent — on a white page a plain outlined
         * button reads as disabled next to a filled one, and secondary CTAs
         * like "Request a quote" were disappearing.
         */
        outline:
          "border border-primary/30 bg-primary/[0.06] text-primary hover:border-primary/50 hover:bg-primary/[0.12]",
        /** Filled but quiet — pairs with `default` as a secondary action. */
        secondary: "bg-secondary text-secondary-foreground hover:bg-muted",
        /** Chromeless. For toolbars, icon buttons and menu rows. */
        ghost: "text-foreground hover:bg-secondary",
        /** Bordered action sitting on a dark brand surface. */
        onDark:
          "border border-primary-foreground/25 text-primary-foreground hover:border-primary-foreground/50 hover:bg-primary-foreground/10",
        destructive: "bg-destructive text-destructive-foreground shadow-soft hover:brightness-95",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        default: "h-11 px-5 text-sm",
        lg: "h-12 px-7 text-sm",
        /** Hero-scale CTA. */
        xl: "h-[3.25rem] px-8 text-[0.9375rem]",
        icon: "size-10 [&_svg]:size-[1.125rem]",
      },
    },
    compoundVariants: [
      // A link button is inline text; padding and height would misalign it.
      { variant: "link", class: "h-auto px-0 active:translate-y-0" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
