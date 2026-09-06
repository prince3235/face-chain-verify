"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm font-medium transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed",
          variant === "primary" &&
            "bg-scan text-ink hover:bg-scan/90",
          variant === "secondary" &&
            "border border-border bg-transparent text-text hover:bg-surface-raised",
          variant === "ghost" &&
            "bg-transparent text-text-muted hover:text-text",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
