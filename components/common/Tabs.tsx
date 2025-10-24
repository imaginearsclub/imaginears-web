"use client";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";

/**
 * Tabs component for organizing content into separate views
 * Built on @radix-ui/react-tabs for accessibility
 */

const TabsRoot = TabsPrimitive.Root;

const TabsList = forwardRef<
  ElementRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-xl p-1",
      "bg-slate-100 dark:bg-slate-800",
      "text-slate-600 dark:text-slate-400",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
  ElementRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5",
      "text-sm font-medium ring-offset-white transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm",
      "dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white",
      "hover:text-slate-900 dark:hover:text-white",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = forwardRef<
  ElementRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-white",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { TabsRoot as Tabs, TabsList, TabsTrigger, TabsContent };

