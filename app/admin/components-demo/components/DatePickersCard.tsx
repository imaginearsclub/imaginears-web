/* eslint-disable no-unused-vars */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, DatePicker, DateRangePicker, Separator } from "@/components/common";

interface DatePickersCardProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  dateRange: { from?: Date; to?: Date };
  setDateRange: (range: { from?: Date; to?: Date }) => void;
}

export function DatePickersCard({ selectedDate, setSelectedDate, dateRange, setDateRange }: DatePickersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Date Pickers</CardTitle>
        <CardDescription>Calendar-based date selection with single and range modes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-2 block">Single Date Picker</label>
          <DatePicker
            {...(selectedDate && { date: selectedDate })}
            onDateChange={setSelectedDate}
            placeholder="Pick a date"
          />
          {selectedDate && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Selected: {selectedDate.toLocaleDateString()}
            </p>
          )}
        </div>
        <Separator />
        <div>
          <label className="text-sm font-medium mb-2 block">Date Range Picker</label>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onRangeChange={setDateRange}
            placeholder="Pick a date range"
          />
          {(dateRange.from || dateRange.to) && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Range: {dateRange.from?.toLocaleDateString()} - {dateRange.to?.toLocaleDateString() || "..."}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

