"use client";
import { cn } from "@/lib/utils";

export interface SkeletonProps {
  /**
   * Variant for different shapes
   */
  variant?: "text" | "circular" | "rectangular";
  /**
   * Width (can be string with units or number for pixels)
   */
  width?: string | number;
  /**
   * Height (can be string with units or number for pixels)
   */
  height?: string | number;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Skeleton loader component for indicating loading content
 * 
 * @example
 * <Skeleton variant="text" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" width="100%" height={200} />
 */
export function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: SkeletonProps) {
  const styles: React.CSSProperties = {};
  
  if (width) {
    styles.width = typeof width === "number" ? `${width}px` : width;
  }
  
  if (height) {
    styles.height = typeof height === "number" ? `${height}px` : height;
  }

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200 dark:bg-slate-800",
        
        // Variant styles
        variant === "text" && "h-4 w-full rounded",
        variant === "circular" && "rounded-full",
        variant === "rectangular" && "rounded-lg",
        
        className
      )}
      style={styles}
      aria-label="Loading..."
      role="status"
    />
  );
}

/**
 * Convenience component for loading multiple text lines
 */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

