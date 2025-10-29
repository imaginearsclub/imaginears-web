import { memo } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultMessageProps {
  success: boolean;
  message: string;
}

export const ResultMessage = memo(function ResultMessage({ success, message }: ResultMessageProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border-2 animate-in fade-in slide-in-from-top-2",
        success
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      )}
    >
      {success ? (
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
      )}
      <p
        className={cn(
          "text-sm font-medium",
          success
            ? "text-green-800 dark:text-green-200"
            : "text-red-800 dark:text-red-200"
        )}
      >
        {message}
      </p>
    </div>
  );
});

