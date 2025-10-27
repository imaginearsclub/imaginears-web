"use client";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef, useId } from "react";

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

  /**
   * Label text for the input (adds proper <label> element)
   */
  label?: string;

  /**
   * Error message to display below input
   */
  error?: string;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Icon to show on the left side
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to show on the right side
   */
  rightIcon?: React.ReactNode;

  /**
   * Container className (for wrapper div when using label/error/helper)
   */
  containerClassName?: string;
}

/**
 * Accessible input component with validation states, size variants, and ARIA support
 * Automatically includes labels, error messages, and helper text with proper ARIA attributes
 */
export const Input = forwardRef<ElementRef<"input">, InputProps>(
  ({ 
    className,
    containerClassName,
    state = "default", 
    size = "md", 
    type = "text",
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    required,
    id,
    ...props 
  }, ref) => {
    // Generate stable unique ID if not provided (SSR-safe)
    const generatedId = useId();
    const inputId = id || `input-${generatedId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine final state (error prop overrides state prop)
    const finalState = error ? "error" : state;

    const iconSizes = {
      sm: "w-4 h-4",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    const inputElement = (
      <div className="relative">
        {leftIcon && (
          <div className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none",
            iconSizes[size]
          )}>
            <span className="flex items-center justify-center" aria-hidden="true">
              {leftIcon}
            </span>
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={cn(
            error && errorId,
            helperText && helperId
          ) || undefined}
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
            size === "sm" && "h-8 py-1.5 text-sm",
            size === "md" && "h-10 py-2 text-sm",
            size === "lg" && "h-12 py-3 text-base",
            
            // Padding adjustments for icons
            leftIcon ? "pl-10" : size === "sm" ? "px-2.5" : size === "md" ? "px-3" : "px-4",
            rightIcon ? "pr-10" : size === "sm" ? "px-2.5" : size === "md" ? "px-3" : "px-4",
            
            // State variants
            finalState === "default" && [
              "border-slate-300 dark:border-slate-700",
              "hover:border-slate-400 dark:hover:border-slate-600",
              "focus:border-blue-500 focus:ring-blue-500/50",
            ],
            finalState === "error" && [
              "border-red-300 dark:border-red-700",
              "hover:border-red-400 dark:hover:border-red-600",
              "focus:border-red-500 focus:ring-red-500/50",
            ],
            finalState === "success" && [
              "border-emerald-300 dark:border-emerald-700",
              "hover:border-emerald-400 dark:hover:border-emerald-600",
              "focus:border-emerald-500 focus:ring-emerald-500/50",
            ],
            
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none",
            iconSizes[size]
          )}>
            <span className="flex items-center justify-center" aria-hidden="true">
              {rightIcon}
            </span>
          </div>
        )}
      </div>
    );

    // If no label, error, or helper text, return input directly
    if (!label && !error && !helperText) {
      return inputElement;
    }

    // Return wrapped input with label/error/helper
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <label 
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        {inputElement}
        {helperText && !error && (
          <p 
            id={helperId}
            className="text-xs text-slate-500 dark:text-slate-400"
          >
            {helperText}
          </p>
        )}
        {error && (
          <p 
            id={errorId}
            className="text-xs text-red-600 dark:text-red-400"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

