"use client";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Combobox - Searchable Select Component
 * Combines a text input with a dropdown list for powerful filtering
 * Built on Radix Popover + cmdk for excellent UX
 */

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No results found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-900 px-3 py-2 text-sm",
            "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selectedOption && "text-slate-500 dark:text-slate-400",
            className
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedOption?.icon && (
              <span className="shrink-0">{selectedOption.icon}</span>
            )}
            <span className="truncate">
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] rounded-xl border-2 border-slate-200 dark:border-slate-800",
            "bg-white dark:bg-slate-900 p-0 shadow-lg outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <Command className="bg-white dark:bg-slate-900">
            <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 bg-white dark:bg-slate-900">
              <Command.Input
                placeholder={searchPlaceholder}
                value={search}
                onValueChange={setSearch}
                className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-1 bg-white dark:bg-slate-900">
              <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </Command.Empty>
              <Command.Group>
                {options.map((option) => (
                  <Command.Item
                    key={option.value}
                    value={`${option.label} ${option.description || ""}`}
                    {...(option.disabled ? { disabled: true } : {})}
                    onSelect={() => {
                      onChange?.(option.value);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm outline-none",
                      "aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800",
                      "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                      "transition-colors"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.icon && (
                      <span className="mr-2 flex h-5 w-5 items-center justify-center">
                        {option.icon}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export default Combobox;

