"use client";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";

/**
 * Switch component for toggle controls
 * Built on @radix-ui/react-switch for accessibility
 * 
 * @example
 * <Switch checked={enabled} onCheckedChange={setEnabled} />
 * <Switch checked={enabled} onCheckedChange={setEnabled} disabled />
 */
const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "border-2 border-transparent transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
      "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500",
      "data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0",
        "transition-transform",
        "data-[state=checked]:translate-x-5",
        "data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };

