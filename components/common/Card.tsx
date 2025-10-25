"use client";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface CardProps {
  /**
   * Card content
   */
  children: ReactNode;
  /**
   * Visual variant
   */
  variant?: "default" | "bordered" | "elevated";
  /**
   * Padding size
   */
  padding?: "none" | "sm" | "md" | "lg";
  /**
   * Whether the card is interactive (adds hover effect)
   */
  interactive?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Card component for content containers
 * 
 * @example
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * <Card variant="elevated" interactive>
 *   <CardHeader>
 *     <h3>Interactive Card</h3>
 *   </CardHeader>
 *   <CardContent>
 *     Click me!
 *   </CardContent>
 * </Card>
 */
export function Card({ 
  children, 
  variant = "default",
  padding = "md",
  interactive = false,
  className 
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl transition-all duration-200",
        
        // Variant styles
        variant === "default" && [
          "bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-800",
        ],
        variant === "bordered" && [
          "bg-white dark:bg-slate-900",
          "border-2 border-slate-300 dark:border-slate-700",
        ],
        variant === "elevated" && [
          "bg-white dark:bg-slate-900",
          "border border-slate-200 dark:border-slate-800",
          "shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50",
        ],
        
        // Padding variants
        padding === "none" && "p-0",
        padding === "sm" && "p-3",
        padding === "md" && "p-4",
        padding === "lg" && "p-6",
        
        // Interactive styles
        interactive && [
          "cursor-pointer",
          "hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50",
          "hover:border-slate-300 dark:hover:border-slate-700",
          "active:scale-[0.98]",
        ],
        
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card header component
 */
export function CardHeader({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "border-b border-slate-200 dark:border-slate-800 pb-3 mb-3",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card title component
 */
export function CardTitle({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <h3 
      className={cn(
        "text-lg font-semibold text-slate-900 dark:text-white leading-none",
        className
      )}
    >
      {children}
    </h3>
  );
}

/**
 * Card description component
 */
export function CardDescription({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <p 
      className={cn(
        "text-sm text-slate-600 dark:text-slate-400",
        className
      )}
    >
      {children}
    </p>
  );
}

/**
 * Card content component
 */
export function CardContent({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "text-slate-700 dark:text-slate-300",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Card footer component
 */
export function CardFooter({ 
  children, 
  className 
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <div 
      className={cn(
        "border-t border-slate-200 dark:border-slate-800 pt-3 mt-3",
        "flex items-center gap-2",
        className
      )}
    >
      {children}
    </div>
  );
}

