"use client";
import { type ReactNode, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Confirmation Dialog Component
 * Shows a confirmation prompt before executing dangerous actions
 */

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  children?: ReactNode;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  children,
  isLoading = false,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus confirm button when dialog opens (after a small delay for accessibility)
  useEffect(() => {
    if (!open) return;
    
    const timer = setTimeout(() => {
      confirmButtonRef.current?.focus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [open]);

  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  // Keyboard shortcut: Enter key confirms (in addition to button click)
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading]);

  const variantConfig = {
    danger: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-900/20",
      buttonVariant: "danger" as const,
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6" />,
      iconColor: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-50 dark:bg-amber-900/20",
      buttonVariant: "primary" as const,
    },
    info: {
      icon: <CheckCircle className="w-6 h-6" />,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-900/20",
      buttonVariant: "primary" as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={cn("flex-shrink-0 rounded-full p-3", config.iconBg)}>
              <div className={config.iconColor}>{config.icon}</div>
            </div>
            <div className="flex-1 pt-1">
              <DialogTitle className="text-left">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-2">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>
        
        {children && (
          <div className="text-sm text-slate-600 dark:text-slate-400 pl-16">
            {children}
          </div>
        )}

        <DialogFooter className="flex-row justify-end gap-3 sm:gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            ariaLabel={`${cancelText} (Escape key)`}
          >
            {cancelText}
          </Button>
          <Button
            ref={confirmButtonRef}
            variant={config.buttonVariant}
            size="md"
            onClick={handleConfirm}
            isLoading={isLoading}
            loadingText={confirmText}
            ariaLabel={`${confirmText} (Enter key)`}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmDialog;

