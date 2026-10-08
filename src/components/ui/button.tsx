import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-r from-brand-600 via-brand-500 to-accent-500 text-white shadow-lift hover:opacity-95 hover:-translate-y-0.5 focus-visible:ring-brand-400",
  secondary:
    "bg-surface text-ink border border-line shadow-soft hover:border-brand-300 hover:text-brand-700 hover:-translate-y-0.5 focus-visible:ring-brand-300",
  ghost:
    "text-ink-soft hover:text-brand-700 hover:bg-brand-50 focus-visible:ring-brand-300",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-base",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

export function buttonClasses(variant: Variant = "primary", size: Size = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    variantClasses[variant],
    sizeClasses[size]
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild, children, ...props }, ref) => {
    const classes = cn(buttonClasses(variant, size), className);

    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement<{ className?: string }>;
      return React.cloneElement(child, {
        className: cn(classes, child.props.className),
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
