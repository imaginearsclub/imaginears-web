/* eslint-disable no-unused-vars */
import { Alert, type CommandItem, type ComboboxOption } from "@/components/common";
import { CommandPaletteCard } from "./CommandPaletteCard";
import { ComboboxCard } from "./ComboboxCard";
import { DatePickersCard } from "./DatePickersCard";
import { ContextMenuCard } from "./ContextMenuCard";

interface AdvancedTabProps {
  commandItems: CommandItem[];
  frameworks: ComboboxOption[];
  comboboxValue: string;
  setComboboxValue: (value: string) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  dateRange: { from?: Date; to?: Date };
  setDateRange: (range: { from?: Date; to?: Date }) => void;
}
export function AdvancedTab({
  commandItems,
  frameworks,
  comboboxValue,
  setComboboxValue,
  selectedDate,
  setSelectedDate,
  dateRange,
  setDateRange,
}: AdvancedTabProps) {
  return (
    <div className="space-y-6">
      <CommandPaletteCard commandItems={commandItems} />
      <ComboboxCard frameworks={frameworks} comboboxValue={comboboxValue} setComboboxValue={setComboboxValue} />
      <DatePickersCard selectedDate={selectedDate} setSelectedDate={setSelectedDate} dateRange={dateRange} setDateRange={setDateRange} />
      <ContextMenuCard />
      <Alert variant="success">
        <strong>🎉 Advanced components ready!</strong> These powerful components bring modern UX patterns to your application.
      </Alert>
    </div>
  );
}