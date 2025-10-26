"use client";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  /**
   * Visual variant of the badge
   * - default: Neutral gray
   * - primary: Blue (primary actions, navigation)
   * - success: Green (success states, active)
   * - warning: Amber (warnings, pending)
   * - danger: Red (errors, critical)
   * - info: Sky blue (information)
   * - purple: Purple (settings, configuration)
   * - orange: Orange (tools, moderate warnings)
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info" | "purple" | "orange";
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Whether this badge represents a status (adds role="status" for screen readers)
   */
  isStatus?: boolean;
  /**
   * ARIA label for accessibility (especially useful for icon-only badges)
   */
  ariaLabel?: string;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge component for status indicators, labels, and counts
 * With comprehensive color palette and ARIA support
 * 
 * @example
 * <Badge variant="success" isStatus>Active</Badge>
 * <Badge variant="danger" size="sm" ariaLabel="Error count">3</Badge>
 * <Badge variant="purple">Settings</Badge>
 */
export function Badge({ 
  children, 
  variant = "default", 
  size = "md",
  isStatus = false,
  ariaLabel,
  className 
}: BadgeProps) {
  return (
    <span
      role={isStatus ? "status" : undefined}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-medium rounded-full border transition-colors",
        
        // Size variants
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-0.5 text-xs",
        size === "lg" && "px-3 py-1 text-sm",
        
        // Color variants - 8 total for comprehensive palette
        variant === "default" && [
          "bg-slate-100 text-slate-700 border-slate-200",
          "dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700",
        ],
        variant === "primary" && [
          "bg-blue-50 text-blue-800 border-blue-200",
          "dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
        ],
        variant === "success" && [
          "bg-emerald-50 text-emerald-800 border-emerald-200",
          "dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
        ],
        variant === "warning" && [
          "bg-amber-50 text-amber-800 border-amber-200",
          "dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
        ],
        variant === "danger" && [
          "bg-rose-50 text-rose-700 border-rose-200",
          "dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800",
        ],
        variant === "info" && [
          "bg-sky-50 text-sky-800 border-sky-200",
          "dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800",
        ],
        variant === "purple" && [
          "bg-purple-50 text-purple-800 border-purple-200",
          "dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800",
        ],
        variant === "orange" && [
          "bg-orange-50 text-orange-800 border-orange-200",
          "dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-800",
        ],
        
        className
      )}
    >
      {children}
    </span>
  );
}

