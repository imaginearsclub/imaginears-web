import { memo } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/common";
import { Save } from "lucide-react";

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div className="p-6 space-y-6">{children}</div>
    </div>
  );
}

export function CardHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 -mt-6 -mx-6 px-6 pt-6 bg-slate-50/50 dark:bg-slate-800/30">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{description}</p>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}

export const SaveButton = memo(function SaveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all",
          "bg-blue-600 dark:bg-blue-500 text-white",
          "hover:bg-blue-700 dark:hover:bg-blue-600",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {disabled ? (
          <>
            <Spinner size="sm" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
});

export const inputClass = cn(
  "w-full rounded-xl border-2 px-4 py-3",
  "border-slate-300 dark:border-slate-700",
  "bg-white dark:bg-slate-900",
  "text-slate-900 dark:text-white",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
  "transition-all"
);

