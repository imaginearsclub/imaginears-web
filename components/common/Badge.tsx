"use client";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  /**
   * Visual variant of the badge
   */
  variant?: "default" | "primary" | "success" | "warning" | "danger" | "info";
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Badge component for status indicators, labels, and counts
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="danger" size="sm">Error</Badge>
 */
export function Badge({ 
  children, 
  variant = "default", 
  size = "md",
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        // Base styles
        "inline-flex items-center justify-center font-medium rounded-full border transition-colors",
        
        // Size variants
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-2.5 py-0.5 text-xs",
        size === "lg" && "px-3 py-1 text-sm",
        
        // Color variants
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
        
        className
      )}
    >
      {children}
    </span>
  );
}

