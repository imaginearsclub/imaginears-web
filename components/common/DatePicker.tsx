"use client";
import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import "react-day-picker/dist/style.css";

/**
 * DatePicker Component
 * A calendar-based date picker with dropdown interface
 * Built with react-day-picker and date-fns
 */

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  disabledDays?: (date: Date) => boolean;
  fromDate?: Date;
  toDate?: Date;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled = false,
  className,
  disabledDays,
  fromDate,
  toDate,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-900 px-3 py-2 text-sm text-left font-normal",
            "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !date && "text-slate-500 dark:text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {date ? format(date, "PPP") : <span>{placeholder}</span>}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate);
            setIsOpen(false);
          }}
          {...(disabledDays && { disabled: disabledDays })}
          {...(fromDate && { fromDate })}
          {...(toDate && { toDate })}
          className={cn(
            "p-3",
            "[&_.rdp-month]:space-y-4",
            "[&_.rdp-caption]:flex [&_.rdp-caption]:justify-center [&_.rdp-caption]:pt-1 [&_.rdp-caption]:relative [&_.rdp-caption]:items-center",
            "[&_.rdp-caption_h2]:text-sm [&_.rdp-caption_h2]:font-semibold",
            "[&_.rdp-nav]:space-x-1 [&_.rdp-nav]:flex [&_.rdp-nav]:items-center",
            "[&_.rdp-nav_button]:h-7 [&_.rdp-nav_button]:w-7 [&_.rdp-nav_button]:bg-transparent [&_.rdp-nav_button]:p-0 [&_.rdp-nav_button]:opacity-50 [&_.rdp-nav_button:hover]:opacity-100",
            "[&_.rdp-table]:w-full [&_.rdp-table]:border-collapse [&_.rdp-table]:space-y-1",
            "[&_.rdp-head_row]:flex",
            "[&_.rdp-head_cell]:text-slate-500 [&_.rdp-head_cell]:rounded-md [&_.rdp-head_cell]:w-9 [&_.rdp-head_cell]:font-normal [&_.rdp-head_cell]:text-[0.8rem] dark:[&_.rdp-head_cell]:text-slate-400",
            "[&_.rdp-row]:flex [&_.rdp-row]:w-full [&_.rdp-row]:mt-2",
            "[&_.rdp-cell]:h-9 [&_.rdp-cell]:w-9 [&_.rdp-cell]:text-center [&_.rdp-cell]:text-sm [&_.rdp-cell]:p-0 [&_.rdp-cell]:relative",
            "[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:p-0 [&_.rdp-day]:font-normal [&_.rdp-day]:rounded-lg [&_.rdp-day]:transition-colors",
            "[&_.rdp-day:hover]:bg-slate-100 dark:[&_.rdp-day:hover]:bg-slate-800",
            "[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white [&_.rdp-day_selected:hover]:bg-blue-700",
            "[&_.rdp-day_today]:bg-slate-100 dark:[&_.rdp-day_today]:bg-slate-800",
            "[&_.rdp-day_outside]:text-slate-400 [&_.rdp-day_outside]:opacity-50 dark:[&_.rdp-day_outside]:text-slate-600",
            "[&_.rdp-day_disabled]:text-slate-400 [&_.rdp-day_disabled]:opacity-50 dark:[&_.rdp-day_disabled]:text-slate-600"
          )}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * DateRangePicker Component
 * Pick a date range (start and end dates)
 */
interface DateRangePickerProps {
  from?: Date | undefined;
  to?: Date | undefined;
  onRangeChange?: (range: { from?: Date; to?: Date }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateRangePicker({
  from,
  to,
  onRangeChange,
  placeholder = "Pick a date range",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-900 px-3 py-2 text-sm text-left font-normal",
            "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !from && "text-slate-500 dark:text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {from ? (
              to ? (
                <>
                  {format(from, "LLL dd, y")} - {format(to, "LLL dd, y")}
                </>
              ) : (
                format(from, "LLL dd, y")
              )
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="range"
          selected={from || to ? { from, to } : undefined}
          onSelect={(range) => {
            if (range) {
              const normalizedRange: { from?: Date; to?: Date } = {};
              if (range.from) normalizedRange.from = range.from;
              if (range.to) normalizedRange.to = range.to;
              onRangeChange?.(normalizedRange);
            } else {
              onRangeChange?.({});
            }
          }}
          numberOfMonths={2}
          className={cn(
            "p-3",
            "[&_.rdp-month]:space-y-4",
            "[&_.rdp-caption]:flex [&_.rdp-caption]:justify-center [&_.rdp-caption]:pt-1 [&_.rdp-caption]:relative [&_.rdp-caption]:items-center",
            "[&_.rdp-caption_h2]:text-sm [&_.rdp-caption_h2]:font-semibold",
            "[&_.rdp-nav]:space-x-1 [&_.rdp-nav]:flex [&_.rdp-nav]:items-center",
            "[&_.rdp-nav_button]:h-7 [&_.rdp-nav_button]:w-7 [&_.rdp-nav_button]:bg-transparent [&_.rdp-nav_button]:p-0 [&_.rdp-nav_button]:opacity-50 [&_.rdp-nav_button:hover]:opacity-100",
            "[&_.rdp-table]:w-full [&_.rdp-table]:border-collapse [&_.rdp-table]:space-y-1",
            "[&_.rdp-head_row]:flex",
            "[&_.rdp-head_cell]:text-slate-500 [&_.rdp-head_cell]:rounded-md [&_.rdp-head_cell]:w-9 [&_.rdp-head_cell]:font-normal [&_.rdp-head_cell]:text-[0.8rem] dark:[&_.rdp-head_cell]:text-slate-400",
            "[&_.rdp-row]:flex [&_.rdp-row]:w-full [&_.rdp-row]:mt-2",
            "[&_.rdp-cell]:h-9 [&_.rdp-cell]:w-9 [&_.rdp-cell]:text-center [&_.rdp-cell]:text-sm [&_.rdp-cell]:p-0 [&_.rdp-cell]:relative",
            "[&_.rdp-day]:h-9 [&_.rdp-day]:w-9 [&_.rdp-day]:p-0 [&_.rdp-day]:font-normal [&_.rdp-day]:rounded-lg [&_.rdp-day]:transition-colors",
            "[&_.rdp-day:hover]:bg-slate-100 dark:[&_.rdp-day:hover]:bg-slate-800",
            "[&_.rdp-day_selected]:bg-blue-600 [&_.rdp-day_selected]:text-white",
            "[&_.rdp-day_range_middle]:bg-blue-100 [&_.rdp-day_range_middle]:text-blue-900 dark:[&_.rdp-day_range_middle]:bg-blue-900/30 dark:[&_.rdp-day_range_middle]:text-blue-100",
            "[&_.rdp-day_today]:bg-slate-100 dark:[&_.rdp-day_today]:bg-slate-800",
            "[&_.rdp-day_outside]:text-slate-400 [&_.rdp-day_outside]:opacity-50 dark:[&_.rdp-day_outside]:text-slate-600"
          )}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;

