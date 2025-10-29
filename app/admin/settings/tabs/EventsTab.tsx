import { memo } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/common";
import { Card, CardHeader, Field, SaveButton, inputClass } from "../components/SettingsComponents";
import { TimesEditor } from "../components/TimesEditor";

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"] as const;

interface EventsTabProps {
  settings: {
    events: {
      defaultCategory: "Fireworks" | "Seasonal" | "MeetAndGreet" | "Parade" | "Other";
      recurrenceFreq: "NONE" | "DAILY" | "WEEKLY";
      byWeekday: ("SU" | "MO" | "TU" | "WE" | "TH" | "FR" | "SA")[];
      times: string[];
    };
  };
  /* eslint-disable-next-line no-unused-vars */
  onChange: (partial: Partial<EventsTabProps["settings"]>) => void;
  /* eslint-disable-next-line no-unused-vars */
  onSave: (data: Partial<EventsTabProps["settings"]>) => void;
  saving: boolean;
}

export const EventsTab = memo(function EventsTab({ settings, onChange, onSave, saving }: EventsTabProps) {
  return (
    <Card>
      <CardHeader title="Event Defaults" description="Default values for creating new events" />
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Default Category">
            <select
              className={inputClass}
              value={settings.events.defaultCategory}
              onChange={(e) =>
                onChange({
                  events: {
                    ...settings.events,
                    defaultCategory: e.target.value as EventsTabProps["settings"]["events"]["defaultCategory"],
                  },
                })
              }
            >
              <option value="Fireworks">Fireworks</option>
              <option value="Seasonal">Seasonal</option>
              <option value="MeetAndGreet">Meet & Greet</option>
              <option value="Parade">Parade</option>
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Default Recurrence">
            <select
              className={inputClass}
              value={settings.events.recurrenceFreq}
              onChange={(e) =>
                onChange({
                  events: {
                    ...settings.events,
                    recurrenceFreq: e.target.value as EventsTabProps["settings"]["events"]["recurrenceFreq"],
                  },
                })
              }
            >
              <option value="NONE">One-time</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
            </select>
          </Field>
        </div>

        {settings.events.recurrenceFreq === "WEEKLY" && (
          <Field label="Default Weekly Days">
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map((d) => {
                const active = settings.events.byWeekday.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      const set = new Set(settings.events.byWeekday);
                      if (active) {
                        set.delete(d);
                      } else {
                        set.add(d);
                      }
                      onChange({
                        events: { ...settings.events, byWeekday: Array.from(set) as typeof WEEKDAYS[number][] },
                      });
                    }}
                    className={cn(
                      "rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all",
                      active
                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                        : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Separator />

        <Field label="Default Showtimes">
          <TimesEditor
            times={settings.events.times}
            onChange={(times: string[]) => onChange({ events: { ...settings.events, times } })}
          />
        </Field>

        <SaveButton onClick={() => onSave({ events: settings.events })} disabled={saving} />
      </div>
    </Card>
  );
});

