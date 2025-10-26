"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Command } from "cmdk";
import { Dialog, DialogContent, DialogPortal, DialogOverlay, DialogTitle } from "./Dialog";
import { cn } from "@/lib/utils";
import { 
  Search, 
  Clock, 
  Hash, 
  Navigation, 
  Settings, 
  Users, 
  Wrench,
  TrendingUp,
  Zap
} from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";

/**
 * Command Palette (Cmd+K / Ctrl+K)
 * A powerful keyboard-driven command menu for navigation and actions
 * Built with cmdk library for excellent UX
 * 
 * Features:
 * - Recently used commands tracking (last 5, within 7 days)
 * - Result count & statistics display
 * - Quick filter tags by group with icons & colors
 * - Usage analytics badges (shows command usage count)
 * - Enhanced keyboard shortcuts (⌘S, ⌘B, ⌘R, ⌘H, ⌘D)
 * - Role-based command filtering (RBAC)
 * - Trending & Most Used indicators
 * - Smart contextual suggestions (time-based & page-based)
 * - Visual hierarchy with group icons and color coding
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
  requiredPermission?: string; // For role-based filtering
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
  userPermissions?: string[]; // For role-based filtering
}

// Group configuration with icons and colors
const GROUP_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  Navigation: {
    icon: <Navigation className="w-3.5 h-3.5" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  Settings: {
    icon: <Settings className="w-3.5 h-3.5" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  Management: {
    icon: <Users className="w-3.5 h-3.5" />,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  Tools: {
    icon: <Wrench className="w-3.5 h-3.5" />,
    color: "text-orange-600 dark:text-orange-400",
    bgColor: "bg-orange-50 dark:bg-orange-900/20",
  },
  Commands: {
    icon: <Zap className="w-3.5 h-3.5" />,
    color: "text-slate-600 dark:text-slate-400",
    bgColor: "bg-slate-50 dark:bg-slate-900/20",
  },
};

export function CommandPalette({
  items,
  placeholder = "Type a command or search...",
  emptyMessage = "No results found.",
  className,
  userPermissions = [],
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [recentCommands, setRecentCommands] = useState<RecentCommand[]>([]);
  const [currentPath, setCurrentPath] = useState<string>("");

  // Load recent commands from localStorage and track current path
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRecent = localStorage.getItem("commandPalette.recent");
      if (storedRecent) {
        try {
          setRecentCommands(JSON.parse(storedRecent));
        } catch (e) {
          console.error("Failed to load recent commands", e);
        }
      }
      setCurrentPath(window.location.pathname);
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

  // Helper function to execute a command by ID
  const executeCommand = useCallback((commandId: string) => {
    console.log('executeCommand called for:', commandId);
    const command = items.find((item) => item.id === commandId);
    console.log('Found command:', command ? command.label : 'NOT FOUND');
    if (command) {
      // Check permission if required
      if (command.requiredPermission && userPermissions.length > 0 && !userPermissions.includes(command.requiredPermission)) {
        console.log(`Permission denied for command: ${commandId}`);
        return;
      }
      console.log('Executing command:', commandId);
      trackRecentCommand(command.id);
      command.onSelect();
    } else {
      console.log(`Command not found: ${commandId}`);
    }
  }, [items, userPermissions, trackRecentCommand]);

  // Toggle command palette - works anywhere
  useHotkeys('mod+k', (e) => {
    console.log('mod+k pressed');
    e.preventDefault();
    setOpen((prev) => !prev);
  }, { 
    enableOnFormTags: true,
    enableOnContentEditable: true,
  }, []);

  // Direct navigation shortcuts - work anywhere when palette is closed
  useHotkeys('mod+s', (e) => {
    console.log('mod+s pressed, palette open:', open);
    if (!open) {
      e.preventDefault();
      executeCommand('sessions');
    }
  }, { 
    enableOnFormTags: false,
    enableOnContentEditable: false,
  }, [open, executeCommand]);

  useHotkeys('mod+b', (e) => {
    console.log('mod+b pressed, palette open:', open);
    if (!open) {
      e.preventDefault();
      executeCommand('bulk-users');
    }
  }, { 
    enableOnFormTags: false,
    enableOnContentEditable: false,
  }, [open, executeCommand]);

  useHotkeys('mod+r', (e) => {
    console.log('mod+r pressed, palette open:', open);
    if (!open) {
      e.preventDefault();
      executeCommand('roles');
    }
  }, { 
    enableOnFormTags: false,
    enableOnContentEditable: false,
  }, [open, executeCommand]);

  useHotkeys('mod+h', (e) => {
    console.log('mod+h pressed, palette open:', open);
    if (!open) {
      e.preventDefault();
      executeCommand('sessions-health');
    }
  }, { 
    enableOnFormTags: false,
    enableOnContentEditable: false,
  }, [open, executeCommand]);

  useHotkeys('mod+d', (e) => {
    console.log('mod+d pressed, palette open:', open);
    if (!open) {
      e.preventDefault();
      executeCommand('dashboard');
    }
  }, { 
    enableOnFormTags: false,
    enableOnContentEditable: false,
  }, [open, executeCommand]);

  // Close on item select
  const handleSelect = useCallback((item: CommandItem) => {
    trackRecentCommand(item.id);
    setOpen(false);
    setSearch("");
    item.onSelect();
  }, [trackRecentCommand]);

  // Filter items by active group filter and user permissions
  const filteredItems = useMemo(() => {
    let filtered = items;

    // Role-based filtering
    if (userPermissions.length > 0) {
      filtered = filtered.filter((item) => {
        if (!item.requiredPermission) return true; // No permission required
        return userPermissions.includes(item.requiredPermission);
      });
    }

    // Group filtering
    if (activeFilter) {
      filtered = filtered.filter((item) => (item.group || "Commands") === activeFilter);
    }

    return filtered;
  }, [items, activeFilter, userPermissions]);

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
      .map((recent) => filteredItems.find((item) => item.id === recent.id))
      .filter((item): item is CommandItem => item !== undefined);
  }, [recentCommands, filteredItems]);

  // Calculate trending commands (usage increased in last 24h vs previous 7 days)
  const getMostUsedCommand = useMemo(() => {
    if (recentCommands.length === 0) return null;
    const sorted = [...recentCommands].sort((a, b) => b.count - a.count);
    const topCommand = sorted[0];
    return topCommand && topCommand.count > 5 ? topCommand.id : null;
  }, [recentCommands]);

  // Check if a command is trending (used multiple times in last 24h)
  const isTrending = useCallback((commandId: string): boolean => {
    const recent = recentCommands.find((r) => r.id === commandId);
    if (!recent) return false;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return recent.timestamp > oneDayAgo && recent.count >= 3;
  }, [recentCommands]);

  // Smart Suggestions based on context (used in UI below)
  const suggestedItems = useMemo(() => {
    const suggestions: CommandItem[] = [];
    const hour = new Date().getHours();

    // Time-based suggestions
    if (hour >= 9 && hour < 12) {
      // Morning: suggest dashboard
      const dashboardCmd = items.find((item) => item.id === "dashboard");
      if (dashboardCmd && !suggestions.includes(dashboardCmd)) suggestions.push(dashboardCmd);
    } else if (hour >= 14 && hour < 17) {
      // Afternoon: suggest sessions or bulk users
      const sessionsCmd = items.find((item) => item.id === "sessions");
      if (sessionsCmd && !suggestions.includes(sessionsCmd)) suggestions.push(sessionsCmd);
    }

    // Context-based suggestions (current page)
    if (currentPath.includes("/admin/sessions")) {
      const healthCmd = items.find((item) => item.id === "sessions-health");
      const policiesCmd = items.find((item) => item.id === "sessions-policies");
      if (healthCmd && !suggestions.includes(healthCmd)) suggestions.push(healthCmd);
      if (policiesCmd && !suggestions.includes(policiesCmd)) suggestions.push(policiesCmd);
    } else if (currentPath.includes("/admin/dashboard")) {
      const sessionsCmd = items.find((item) => item.id === "sessions");
      const eventsCmd = items.find((item) => item.id === "events");
      if (sessionsCmd && !suggestions.includes(sessionsCmd)) suggestions.push(sessionsCmd);
      if (eventsCmd && !suggestions.includes(eventsCmd)) suggestions.push(eventsCmd);
    }

    // Filter out already recent commands and apply permissions
    return suggestions
      .filter((item) => !recentItems.some((recent) => recent.id === item.id))
      .filter((item) => {
        if (!item.requiredPermission) return true;
        if (userPermissions.length === 0) return true;
        return userPermissions.includes(item.requiredPermission);
      })
      .slice(0, 3); // Max 3 suggestions
  }, [items, currentPath, recentItems, userPermissions]);

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
          <DialogContent className="overflow-hidden p-0 max-w-3xl w-[90vw] bg-white dark:bg-slate-900 [&>button]:absolute [&>button]:right-3 [&>button]:top-3 [&>button]:z-10 [&>button]:bg-white [&>button]:dark:bg-slate-900 [&>button]:hover:bg-slate-100 [&>button]:dark:hover:bg-slate-800 [&>button]:p-1.5 [&>button]:rounded-md">
            <DialogTitle className="sr-only">Command Palette</DialogTitle>
            <Command className="bg-white dark:bg-slate-900 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
              {/* Enhanced Search Input */}
              <div className="relative flex items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="absolute left-4 pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                </div>
                <Command.Input
                  placeholder={placeholder}
                  value={search}
                  onValueChange={setSearch}
                  className="flex h-14 w-full rounded-md bg-transparent py-4 pl-11 pr-12 text-sm text-slate-900 dark:text-slate-100 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Clear search"
                  >
                    <span className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs font-medium">
                      ESC
                    </span>
                  </button>
                )}
              </div>

              {/* Stats Bar */}
              <div className="flex items-center justify-between px-3 py-2 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    <strong className="text-slate-700 dark:text-slate-300">{totalItems}</strong> command{totalItems !== 1 ? 's' : ''}
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

              {/* Quick Filter Tags with Icons & Colors */}
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
                    const groupConfig = (GROUP_CONFIG as Record<string, { icon: React.ReactNode; color: string; bgColor: string }>)[group] || GROUP_CONFIG["Commands"];
                    if (!groupConfig) return null;
                    const { icon, color, bgColor } = groupConfig;
                    return (
                      <button
                        key={group}
                        onClick={() => setActiveFilter(isActive ? null : group)}
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md whitespace-nowrap transition-all border font-medium",
                          isActive
                            ? cn(bgColor, color, "border-current ring-2 ring-offset-1", color.replace('text-', 'ring-'))
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        <span className={isActive ? color : "text-slate-500 dark:text-slate-500"}>
                          {icon}
                        </span>
                        <span>{group}</span>
                        <span className="opacity-60">({count})</span>
                      </button>
                    );
                  })}
                </div>
              )}

              <Command.List className="max-h-[500px] overflow-y-auto overflow-x-hidden p-3 bg-white dark:bg-slate-900">
                <Command.Empty className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  {emptyMessage}
                </Command.Empty>

                {/* Suggested Commands Group */}
                {!search && suggestedItems.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Suggested for you</span>
                      </div>
                    }
                    className="[&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 mb-2"
                  >
                    {suggestedItems.map((item) => (
                      <Command.Item
                        key={`suggested-${item.id}`}
                        value={`${item.label} ${item.description || ""} ${item.keywords?.join(" ") || ""}`}
                        onSelect={() => handleSelect(item)}
                        className={cn(
                          "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none group",
                          "aria-selected:bg-slate-100 dark:aria-selected:bg-slate-800",
                          "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                          "transition-colors border-l-2 border-amber-400"
                        )}
                      >
                        {item.icon && (
                          <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                            {item.icon}
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {item.label}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                              Suggested
                            </span>
                          </div>
                          {item.description && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              {item.description}
                            </div>
                          )}
                        </div>
                        {item.shortcut && (
                          <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                            {item.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* Recent Commands Group */}
                {!search && recentItems.length > 0 && (
                  <Command.Group
                    heading={
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Recent</span>
                      </div>
                    }
                    className="[&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-slate-500 dark:[&_[cmdk-group-heading]]:text-slate-400 mb-2"
                  >
                    {recentItems.map((item) => {
                      const recentData = recentCommands.find((r) => r.id === item.id);
                      const timeAgo = recentData ? getTimeAgo(recentData.timestamp) : "";
                      const trending = isTrending(item.id);
                      const mostUsed = getMostUsedCommand === item.id;
                      return (
                        <Command.Item
                          key={`recent-${item.id}`}
                          value={`${item.label} ${item.description || ""} ${item.keywords?.join(" ") || ""}`}
                          onSelect={() => handleSelect(item)}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none group",
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
                              {mostUsed && (
                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-semibold">
                                  🔥 Most Used
                                </span>
                              )}
                              {trending && !mostUsed && (
                                <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                  <TrendingUp className="w-2.5 h-2.5" />
                                  Trending
                                </span>
                              )}
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-400">{timeAgo}</span>
                            </div>
                            {item.description && (
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {item.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                )}

                {Object.entries(groupedItems).map(([group, groupItems]) => {
                  const groupConfig = (GROUP_CONFIG as Record<string, { icon: React.ReactNode; color: string; bgColor: string }>)[group] || GROUP_CONFIG["Commands"];
                  if (!groupConfig) return null;
                  const { icon, color } = groupConfig;
                  return (
                  <Command.Group
                    key={group}
                    heading={
                      <div className="flex items-center gap-1.5">
                        <span className={color}>{icon}</span>
                        <span>{group}</span>
                      </div>
                    }
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
                            "relative flex cursor-pointer select-none items-center rounded-lg px-2 py-2.5 text-sm outline-none group",
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
                          {item.shortcut && (
                            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-1.5 font-mono text-[10px] font-medium text-slate-600 dark:text-slate-400">
                              {item.shortcut}
                            </kbd>
                          )}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                  );
                })}
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

