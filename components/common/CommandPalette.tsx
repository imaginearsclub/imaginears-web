"use client";
import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogPortal, DialogOverlay, DialogTitle } from "./Dialog";
import { cn } from "@/lib/utils";
import { Search, ArrowRight } from "lucide-react";

/**
 * Command Palette (Cmd+K / Ctrl+K)
 * A powerful keyboard-driven command menu for navigation and actions
 * Built with cmdk library for excellent UX
 */

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
  keywords?: string[];
  group?: string;
}

interface CommandPaletteProps {
  items: CommandItem[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

export function CommandPalette({
  items,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  className,
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Keyboard shortcut handler
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Close on item select
  const handleSelect = useCallback((callback: () => void) => {
    setOpen(false);
    setSearch("");
    callback();
  }, []);

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const group = item.group || "Commands";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800",
          "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400",
          "hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
          "text-sm group",
          className
        )}
      >
        <Search className="w-4 h-4" />
        <span>Search...</span>
        <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400 opacity-100 group-hover:opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className="overflow-hidden p-0 max-w-2xl bg-white dark:bg-slate-900 [&>button]:absolute [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:bg-white [&>button]:dark:bg-slate-900 [&>button]:hover:bg-slate-100 [&>button]:dark:hover:bg-slate-800 [&>button]:p-1.5 [&>button]:rounded-md">
            <DialogTitle className="sr-only">Command Palette</DialogTitle>
            <Command className="bg-white dark:bg-slate-900 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-3 pr-12 bg-white dark:bg-slate-900">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Command.Input
                  placeholder={placeholder}
                  value={search}
                  onValueChange={setSearch}
                  className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 bg-white dark:bg-slate-900">
                <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </Command.Empty>
                {Object.entries(groupedItems).map(([group, groupItems]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400"
                  >
                    {groupItems.map((item) => (
                      <Command.Item
                        key={item.id}
                        value={`${item.label} ${item.description || ""} ${item.keywords?.join(" ") || ""}`}
                        onSelect={() => handleSelect(item.onSelect)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none",
                          "aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800",
                          "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          "transition-colors"
                        )}
                      >
                        {item.icon && (
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 dark:text-slate-100">
                            {item.label}
                          </div>
                          {item.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.shortcut ? (
                          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                            {item.shortcut}
                          </kbd>
                        ) : (
                          <ArrowRight className="w-4 h-4 opacity-0 group-aria-selected:opacity-50" />
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                ))}
              </Command.List>
            </Command>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}

export default CommandPalette;

