"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";
export type ToastPosition = "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: ToastAction;
  progress?: boolean;
  onClose?: () => void;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (!toast.progress || toast.type === "loading" || !toast.duration) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [toast.progress, toast.duration, toast.type]);

  useEffect(() => {
    if (toast.type === "loading" || !toast.duration) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration);

    return () => clearTimeout(timer);
  }, [toast.duration, toast.type]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
      toast.onClose?.();
    }, 300);
  };

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "loading":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800";
      case "error":
        return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800";
      case "warning":
        return "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800";
      case "info":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
      case "loading":
        return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800";
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      case "warning":
        return "bg-amber-500";
      case "info":
      case "loading":
        return "bg-blue-500";
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 shadow-lg transition-all duration-300 max-w-md w-full",
        getColors(),
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right"
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
              {toast.title}
            </h4>
            {toast.message && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {toast.message}
              </p>
            )}

            {toast.action && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.action!.onClick();
                    handleDismiss();
                  }}
                  className="text-xs"
                >
                  {toast.action.label}
                </Button>
              </div>
            )}
          </div>

          {toast.type !== "loading" && (
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {toast.progress && toast.type !== "loading" && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700">
          <div
            className={cn("h-full transition-all duration-100", getProgressColor())}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

interface ToastContainerProps {
  position?: ToastPosition;
}

let toastIdCounter = 0;
const toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastQueue: Toast[] = [];

export const toast = {
  success: (title: string, options?: Partial<Omit<Toast, "id" | "type" | "title">>) => {
    addToast({ ...options, type: "success", title } as Toast);
  },
  error: (title: string, options?: Partial<Omit<Toast, "id" | "type" | "title">>) => {
    addToast({ ...options, type: "error", title } as Toast);
  },
  warning: (title: string, options?: Partial<Omit<Toast, "id" | "type" | "title">>) => {
    addToast({ ...options, type: "warning", title } as Toast);
  },
  info: (title: string, options?: Partial<Omit<Toast, "id" | "type" | "title">>) => {
    addToast({ ...options, type: "info", title } as Toast);
  },
  loading: (title: string, options?: Partial<Omit<Toast, "id" | "type" | "title" | "duration">>) => {
    const id = `toast-${toastIdCounter++}`;
    addToast({ ...options, id, type: "loading", title, duration: undefined } as Toast);
    return {
      id,
      dismiss: () => removeToast(id),
      update: (newOptions: Partial<Omit<Toast, "id">>) => {
        updateToast(id, newOptions);
      },
    };
  },
  promise: <T,>(
    promise: Promise<T>,
    {
      loading: loadingMsg,
      success: successMsg,
      error: errorMsg,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    const loadingToast = toast.loading(loadingMsg);

    promise
      .then((data) => {
        const message = typeof successMsg === "function" ? successMsg(data) : successMsg;
        loadingToast.update({ type: "success", title: message, duration: 5000 });
      })
      .catch((error) => {
        const message = typeof errorMsg === "function" ? errorMsg(error) : errorMsg;
        loadingToast.update({ type: "error", title: message, duration: 5000 });
      });

    return loadingToast;
  },
};

function addToast(toast: Toast) {
  if (!toast.id) {
    toast.id = `toast-${toastIdCounter++}`;
  }
  if (toast.duration === undefined && toast.type !== "loading") {
    toast.duration = 5000;
  }
  if (toast.progress === undefined) {
    toast.progress = true;
  }

  toastQueue = [...toastQueue, toast];
  notifyListeners();
}

function removeToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  notifyListeners();
}

function updateToast(id: string, updates: Partial<Omit<Toast, "id">>) {
  toastQueue = toastQueue.map((t) => (t.id === id ? { ...t, ...updates } : t));
  notifyListeners();
}

function notifyListeners() {
  toastListeners.forEach((listener) => listener(toastQueue));
}

export function ToastContainer({ position = "top-right" }: ToastContainerProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      const index = toastListeners.indexOf(setToasts);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn("fixed z-[100] flex flex-col gap-2", positionClasses[position])}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={removeToast} />
      ))}
    </div>
  );
}

