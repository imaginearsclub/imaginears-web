"use client";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, XCircle, AlertTriangle, X } from "lucide-react";
import { type ReactNode, useState } from "react";

export interface AlertProps {
  /**
   * Alert content
   */
  children: ReactNode;
  /**
   * Alert title (optional)
   */
  title?: string;
  /**
   * Visual variant
   */
  variant?: "info" | "success" | "warning" | "error";
  /**
   * Whether the alert can be dismissed
   */
  dismissible?: boolean;
  /**
   * Callback when alert is dismissed
   */
  onDismiss?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Alert component for displaying important messages to users
 * 
 * @example
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved.
 * </Alert>
 * 
 * <Alert variant="error" dismissible>
 *   Something went wrong. Please try again.
 * </Alert>
 */
export function Alert({
  children,
  title,
  variant = "info",
  dismissible = false,
  onDismiss,
  className,
}: AlertProps) {
  const [visible, setVisible] = useState(true);

  const handleDismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
  };

  const Icon = icons[variant];

  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 rounded-xl border-2 p-4 transition-all",
        
        // Variant styles
        variant === "info" && [
          "bg-blue-50 border-blue-200 text-blue-900",
          "dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-100",
        ],
        variant === "success" && [
          "bg-emerald-50 border-emerald-200 text-emerald-900",
          "dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100",
        ],
        variant === "warning" && [
          "bg-amber-50 border-amber-200 text-amber-900",
          "dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100",
        ],
        variant === "error" && [
          "bg-rose-50 border-rose-200 text-rose-900",
          "dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-100",
        ],
        
        className
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon
          className={cn(
            "h-5 w-5",
            variant === "info" && "text-blue-600 dark:text-blue-400",
            variant === "success" && "text-emerald-600 dark:text-emerald-400",
            variant === "warning" && "text-amber-600 dark:text-amber-400",
            variant === "error" && "text-rose-600 dark:text-rose-400"
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="font-semibold text-sm mb-1">
            {title}
          </h3>
        )}
        <div className="text-sm leading-relaxed">
          {children}
        </div>
      </div>

      {/* Dismiss button */}
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className={cn(
            "flex-shrink-0 rounded-lg p-1 transition-colors",
            "hover:bg-black/5 dark:hover:bg-white/10",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            variant === "info" && "focus:ring-blue-500/50",
            variant === "success" && "focus:ring-emerald-500/50",
            variant === "warning" && "focus:ring-amber-500/50",
            variant === "error" && "focus:ring-rose-500/50"
          )}
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

