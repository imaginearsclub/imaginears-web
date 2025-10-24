"use client";
import { cn } from "@/lib/utils";

export interface ProgressProps {
  /**
   * Progress value (0-100)
   */
  value: number;
  /**
   * Visual variant
   */
  variant?: "default" | "success" | "warning" | "danger";
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
  /**
   * Show percentage text
   */
  showValue?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Progress bar component for showing completion status
 * 
 * @example
 * <Progress value={75} variant="success" showValue />
 * <Progress value={30} variant="warning" size="lg" />
 */
export function Progress({
  value,
  variant = "default",
  size = "md",
  showValue = false,
  className,
}: ProgressProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full",
          "bg-slate-200 dark:bg-slate-800",
          
          // Size variants
          size === "sm" && "h-1.5",
          size === "md" && "h-2.5",
          size === "lg" && "h-4"
        )}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full transition-all duration-300 ease-in-out",
            
            // Variant colors
            variant === "default" && "bg-blue-600 dark:bg-blue-500",
            variant === "success" && "bg-emerald-600 dark:bg-emerald-500",
            variant === "warning" && "bg-amber-600 dark:bg-amber-500",
            variant === "danger" && "bg-rose-600 dark:bg-rose-500"
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      
      {showValue && (
        <div className="mt-1 text-xs text-slate-600 dark:text-slate-400 text-right">
          {clampedValue}%
        </div>
      )}
    </div>
  );
}

