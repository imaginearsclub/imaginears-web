"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogPortal, DialogOverlay, DialogTitle } from "./Dialog";
import { cn } from "@/lib/utils";
import { Search, ArrowRight, Clock } from "lucide-react";

/**
 * Command Palette (Cmd+K / Ctrl+K)
 * A powerful keyboard-driven command menu for navigation and actions
 * Built with cmdk library for excellent UX
 * 
 * Features:
 * - Recently used commands tracking
 * - Result count statistics
 * - Quick filter tags
 * - Keyboard shortcuts
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

interface RecentCommand {
  id: string;
  timestamp: number;
  count: number;
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
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);

  // Load recent commands from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("commandPalette.recent");
      if (stored) {
        try {
          setRecentCommands(JSON.parse(stored));
        } catch (e) {
          console.error("Failed to load recent commands", e);
        }
      }
    }
  }, []);

  // Save recent command
  const trackRecentCommand = useCallback((commandId: string) => {
    setRecentCommands((prev) => {
      const existing = prev.find((c) => c.id === commandId);
      const now = Date.now();
      
      let updated: RecentCommand[];
      if (existing) {
        // Update existing command
        updated = prev.map((c) =>
          c.id === commandId
            ? { ...c, timestamp: now, count: c.count + 1 }
            : c
        );
      } else {
        // Add new command
        updated = [...prev, { id: commandId, timestamp: now, count: 1 }];
      }

      // Keep only last 10 commands, sorted by timestamp
      updated = updated
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 10);

      // Save to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("commandPalette.recent", JSON.stringify(updated));
      }

      return updated;
    });
  }, []);

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
  const handleSelect = useCallback((item: CommandItem) => {
    trackRecentCommand(item.id);
    setOpen(false);
    setSearch("");
    item.onSelect();
  }, [trackRecentCommand]);

  // Filter items by active group filter
  const filteredItems = useMemo(() => {
    if (!activeFilter) return items;
    return items.filter((item) => (item.group || "Commands") === activeFilter);
  }, [items, activeFilter]);

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || "Commands";
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Get recent command items (last 5, within last 7 days)
  const recentItems = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentCommands
      .filter((recent) => recent.timestamp > sevenDaysAgo)
      .slice(0, 5)
      .map((recent) => items.find((item) => item.id === recent.id))
      .filter((item): item is CommandItem => item !== undefined);
  }, [recentCommands, items]);

  // Count total visible items
  const totalItems = filteredItems.length;
  const recentCount = recentItems.length;

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

              {/* Stats Bar */}
              <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <span>
                    Found <strong className="text-slate-700 dark:text-slate-300">{totalItems}</strong> command{totalItems !== 1 ? 's' : ''}
                  </span>
                  {recentCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {recentCount} recent
                    </span>
                  )}
                </div>
                {activeFilter && (
                  <button
                    onClick={() => setActiveFilter(null)}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Clear filter
                  </button>
                )}
              </div>

              {/* Quick Filter Tags */}
              {!search && (
                <div className="flex gap-2 p-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto bg-white dark:bg-slate-900">
                  {Object.keys(items.reduce((acc, item) => {
                    const group = item.group || "Commands";
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(item);
                    return acc;
                  }, {} as Record<string, CommandItem[]>)).map((group) => {
                    const count = items.filter((item) => (item.group || "Commands") === group).length;
                    const isActive = activeFilter === group;
                    return (
                      <button
                        key={group}
                        onClick={() => setActiveFilter(isActive ? null : group)}
                        className={cn(
                          "px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors border",
                          isActive
                            ? "bg-blue-500 text-white border-blue-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        {group} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              <Command.List className="max-h-[400px] overflow-y-auto overflow-x-hidden p-2 bg-white dark:bg-slate-900">
                <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </Command.Empty>

                {/* Recent Commands Group */}
                {!search && recentItems.length > 0 && (
                  <Command.Group
                    heading="Recent"
                    className="[&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 mb-2"
                  >
                    {recentItems.map((item) => {
                      const recentData = recentCommands.find((r) => r.id === item.id);
                      const timeAgo = recentData ? getTimeAgo(recentData.timestamp) : "";
                      return (
                        <Command.Item
                          key={`recent-${item.id}`}
                          value={`${item.label} ${item.description || ""} ${item.keywords?.join(" ") || ""}`}
                          onSelect={() => handleSelect(item)}
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {item.label}
                              </span>
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">{timeAgo}</span>
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
                      );
                    })}
                  </Command.Group>
                )}

                {Object.entries(groupedItems).map(([group, groupItems]) => (
                  <Command.Group
                    key={group}
                    heading={group}
                    className="[&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400"
                  >
                    {groupItems.map((item) => {
                      const recentData = recentCommands.find((r) => r.id === item.id);
                      const usageCount = recentData?.count || 0;
                      return (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.description || ""} ${item.keywords?.join(" ") || ""}`}
                          onSelect={() => handleSelect(item)}
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
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {item.label}
                              </span>
                              {usageCount > 2 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300">
                                  {usageCount}×
                                </span>
                              )}
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
                      );
                    })}
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

// Helper function to format time ago
function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
  return "a while ago";
}

export default CommandPalette;

