import { type CommandItem, type ComboboxOption } from "@/components/common";
import { Home, CalendarRange, Users, Settings, Zap, Star, Heart } from "lucide-react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const getCommandItems = (router: AppRouterInstance): CommandItem[] => [
  {
    id: "home",
    label: "Go to Dashboard",
    description: "Navigate to the main dashboard",
    icon: <Home className="w-4 h-4" />,
    group: "Navigation",
    onSelect: () => router.push("/admin/dashboard"),
  },
  {
    id: "events",
    label: "View Events",
    description: "Manage your events",
    icon: <CalendarRange className="w-4 h-4" />,
    group: "Navigation",
    onSelect: () => router.push("/admin/events"),
  },
  {
    id: "users",
    label: "View Players",
    description: "Manage player accounts",
    icon: <Users className="w-4 h-4" />,
    group: "Navigation",
    onSelect: () => router.push("/admin/players"),
  },
  {
    id: "settings",
    label: "Open Settings",
    description: "Configure your preferences",
    icon: <Settings className="w-4 h-4" />,
    shortcut: "⌘,",
    group: "Actions",
    onSelect: () => router.push("/admin/settings"),
  },
];

export const frameworks: ComboboxOption[] = [
  {
    value: "next",
    label: "Next.js",
    description: "The React Framework",
    icon: <Zap className="w-4 h-4 text-blue-600" />,
  },
  {
    value: "react",
    label: "React",
    description: "A JavaScript library for building UIs",
    icon: <Star className="w-4 h-4 text-cyan-600" />,
  },
  {
    value: "vue",
    label: "Vue",
    description: "The Progressive JavaScript Framework",
    icon: <Heart className="w-4 h-4 text-emerald-600" />,
  },
  {
    value: "svelte",
    label: "Svelte",
    description: "Cybernetically enhanced web apps",
    icon: <Zap className="w-4 h-4 text-orange-600" />,
  },
];

