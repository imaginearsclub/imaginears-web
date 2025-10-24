"use client";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";

export interface InputProps extends Omit<ComponentPropsWithoutRef<"input">, "size"> {
  /**
   * Visual state of the input
   * - default: Normal state
   * - error: Shows error styling (red border)
   * - success: Shows success styling (green border)
   */
  state?: "default" | "error" | "success";
  
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * Accessible input component with validation states and size variants
 * Supports all standard HTML input props and attributes
 */
export const Input = forwardRef<ElementRef<"input">, InputProps>(
  ({ className, state = "default", size = "md", type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          // Base styles
          "w-full rounded-xl border-2 transition-all duration-150",
          "bg-white dark:bg-slate-900",
          "text-slate-900 dark:text-white",
          "placeholder:text-slate-400 dark:placeholder:text-slate-500",
          
          // Focus styles
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          "focus:ring-offset-white dark:focus:ring-offset-slate-900",
          
          // Disabled styles
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-800",
          
          // Size variants
          size === "sm" && "h-8 px-2.5 py-1.5 text-sm",
          size === "md" && "h-10 px-3 py-2 text-sm",
          size === "lg" && "h-12 px-4 py-3 text-base",
          
          // State variants
          state === "default" && [
            "border-slate-300 dark:border-slate-700",
            "hover:border-slate-400 dark:hover:border-slate-600",
            "focus:border-blue-500 focus:ring-blue-500/50",
          ],
          state === "error" && [
            "border-red-300 dark:border-red-700",
            "hover:border-red-400 dark:hover:border-red-600",
            "focus:border-red-500 focus:ring-red-500/50",
          ],
          state === "success" && [
            "border-emerald-300 dark:border-emerald-700",
            "hover:border-emerald-400 dark:hover:border-emerald-600",
            "focus:border-emerald-500 focus:ring-emerald-500/50",
          ],
          
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

