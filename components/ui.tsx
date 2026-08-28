import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/utils/cn";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 font-heading font-bold transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-45",
    "motion-safe:transition-[transform,box-shadow,background-color]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "rounded-full border-2 border-ink bg-primary text-primary-foreground shadow-pop",
          "motion-safe:hover:-translate-x-0.5 motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-pop-hover",
          "motion-safe:active:translate-x-0.5 motion-safe:active:translate-y-0.5 motion-safe:active:shadow-pop-active",
        ].join(" "),
        secondary: [
          "rounded-full border-2 border-ink bg-transparent text-foreground",
          "motion-safe:hover:bg-tertiary",
        ].join(" "),
        outline: [
          "rounded-full border-2 border-ink bg-card text-foreground shadow-[2px_2px_0_0_#E0E0E8]",
          "motion-safe:hover:bg-muted",
        ].join(" "),
        ghost: "rounded-lg border-2 border-transparent bg-transparent text-foreground motion-safe:hover:bg-muted/80",
      },
      size: {
        sm: "min-h-10 px-4 text-xs",
        default: "min-h-12 px-6 text-sm",
        lg: "min-h-14 px-8 text-base",
        icon: "min-h-12 min-w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, children, style, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ transitionTimingFunction: "var(--motion-bounce)", ...style }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({
  className,
  variant = "card",
  title,
  decoration,
  playful = false,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "card" | "terminal" | "explorer";
  title?: string;
  decoration?: "tape" | "tack";
  /** Full sticker wiggle on hover ,  use on marketing pages only */
  playful?: boolean;
}) {
  void decoration;

  const shell = playful ? "surface-card-playful" : "surface-card-product";

  if (variant === "terminal" || variant === "explorer") {
    return (
      <section className={cn("notebook-window overflow-hidden", className)} {...props}>
        {title ? (
          <div className="notebook-title-bar">
            <span className="font-heading text-sm font-bold uppercase tracking-wide text-foreground">{title}</span>
          </div>
        ) : null}
        {children}
      </section>
    );
  }

  return (
    <section className={cn(shell, "overflow-hidden", className)} {...props}>
      {children}
    </section>
  );
}

const badgeTones = {
  neutral: "border-border bg-muted/60 text-muted-foreground",
  hot: "border-ink/20 bg-tertiary/30 text-foreground",
  warm: "border-ink/20 bg-secondary/20 text-foreground",
  cold: "border-border bg-card text-muted-foreground",
  risk: "border-ink/20 bg-tertiary/40 text-foreground",
  success: "border-ink/20 bg-quaternary/30 text-foreground",
  accent: "border-ink bg-primary text-primary-foreground shadow-[2px_2px_0_0_#000000]",
} as const;

export function Badge({
  className,
  tone = "neutral",
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1 rounded-full border-2 px-2.5 py-0.5 font-body text-xs font-semibold",
        badgeTones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function IconCircle({
  className,
  children,
  color = "primary",
  size = "md",
}: {
  className?: string;
  children: React.ReactNode;
  color?: "primary" | "secondary" | "tertiary" | "quaternary";
  size?: "sm" | "md" | "lg";
}) {
  const sizeMap = { sm: "h-9 w-9", md: "h-11 w-11", lg: "h-14 w-14" };
  const colorMap = {
    primary: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-ink",
    tertiary: "bg-tertiary text-ink",
    quaternary: "bg-quaternary text-ink",
  };

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border-2 border-ink shadow-[2px_2px_0_0_#000000]",
        sizeMap[size],
        colorMap[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
