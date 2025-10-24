"use client";
import { cn } from "@/lib/utils";

export interface SpinnerProps {
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Color variant
   */
  variant?: "primary" | "current";
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Accessible label for screen readers
   */
  label?: string;
}

/**
 * Loading spinner component with size and color variants
 * 
 * @example
 * <Spinner size="md" variant="primary" />
 * <Spinner size="lg" label="Loading data..." />
 */
export function Spinner({ 
  size = "md", 
  variant = "primary",
  className,
  label = "Loading..."
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn("inline-block", className)}
    >
      <svg
        className={cn(
          "animate-spin",
          
          // Size variants
          size === "sm" && "h-4 w-4",
          size === "md" && "h-6 w-6",
          size === "lg" && "h-8 w-8",
          size === "xl" && "h-12 w-12",
          
          // Color variants
          variant === "primary" && "text-blue-600 dark:text-blue-400",
          variant === "current" && "text-current"
        )}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

