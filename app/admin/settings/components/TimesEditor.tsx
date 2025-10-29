import { memo } from "react";
import { cn } from "@/lib/utils";
import { inputClass } from "./SettingsComponents";

interface TimesEditorProps {
  times: string[];
  onChange: (times: string[]) => void;
}

export const TimesEditor = memo(function TimesEditor({ times, onChange }: TimesEditorProps) {
  function add(t = "00:00") {
    const set = new Set([...times, t]);
    onChange(Array.from(set).sort());
  }

  function update(i: number, t: string) {
    const next = [...times];
    next[i] = t;
    onChange(next.sort());
  }

  function remove(i: number) {
    onChange(times.filter((_, idx) => idx !== i));
  }

  const displayTimes = times.length > 0 ? times : ["15:00"];

  return (
    <div className="space-y-2">
      {displayTimes.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="time"
            value={t}
            onChange={(e) => update(i, e.target.value)}
            className={cn(inputClass, "w-40")}
            step={60}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className={cn(
              "px-3 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300",
              "border border-red-200 dark:border-red-800",
              "hover:bg-red-100 dark:hover:bg-red-900/30"
            )}
          >
            Remove
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => add("00:00")}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
            "hover:bg-slate-200 dark:hover:bg-slate-700"
          )}
        >
          + Add Time
        </button>
        <button
          type="button"
          onClick={() => onChange(["15:00", "18:00", "21:00"])}
          className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
            "hover:bg-slate-200 dark:hover:bg-slate-700"
          )}
        >
          Set 3p/6p/9p
        </button>
      </div>
    </div>
  );
});

