import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "success" | "danger" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  /**
   * Loading state - shows spinner and disables button
   */
  isLoading?: boolean;
  /**
   * Text to show while loading (defaults to children)
   */
  loadingText?: string;
  /**
   * Icon to show on the left side
   */
  leftIcon?: React.ReactNode;
  /**
   * Icon to show on the right side
   */
  rightIcon?: React.ReactNode;
  /**
   * ARIA label for accessibility (especially important for icon-only buttons)
   */
  ariaLabel?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = "default", 
    size = "md", 
    disabled, 
    isLoading = false,
    loadingText,
    leftIcon,
    rightIcon,
    ariaLabel,
    children, 
    ...props 
  }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg";
    
    const variants = {
      default: "bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 focus-visible:ring-slate-500",
      primary: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus-visible:ring-blue-500",
      success: "bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 focus-visible:ring-green-500",
      danger: "bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 focus-visible:ring-red-500",
      outline: "border-2 border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-slate-500",
      ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-slate-500",
    };
    
    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    };

    const iconSizes = {
      sm: "w-3.5 h-3.5",
      md: "w-4 h-4",
      lg: "w-5 h-5",
    };

    const isDisabled = disabled || isLoading;
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        aria-label={ariaLabel}
        {...props}
      >
        {isLoading && (
          <Loader2 className={cn("animate-spin", iconSizes[size])} aria-hidden="true" />
        )}
        {!isLoading && leftIcon && (
          <span className={cn(iconSizes[size], "flex-shrink-0")} aria-hidden="true">
            {leftIcon}
          </span>
        )}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon && (
          <span className={cn(iconSizes[size], "flex-shrink-0")} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };

