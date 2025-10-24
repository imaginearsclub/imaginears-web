"use client";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

export interface EmptyStateProps {
  /**
   * Icon to display (React node, usually from lucide-react)
   */
  icon?: ReactNode;
  /**
   * Title text
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Optional action button
   */
  action?: ReactNode;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Empty state component for displaying when there's no data
 * 
 * @example
 * <EmptyState
 *   icon={<Inbox className="w-12 h-12" />}
 *   title="No messages"
 *   description="You don't have any messages yet."
 *   action={<button className="btn btn-primary">Send a message</button>}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "py-12 px-4",
        className
      )}
    >
      {icon && (
        <div className={cn(
          "mb-4 rounded-full p-3",
          "bg-slate-100 dark:bg-slate-800",
          "text-slate-400 dark:text-slate-600"
        )}>
          {icon}
        </div>
      )}
      
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mb-4">
          {description}
        </p>
      )}
      
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

