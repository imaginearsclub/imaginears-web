"use client";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from "react";

/**
 * Accessible checkbox component built on @radix-ui/react-checkbox
 * Supports checked, unchecked, and indeterminate states
 */
export const Checkbox = forwardRef<
    ElementRef<typeof CheckboxPrimitive.Root>,
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
    <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
            "peer h-5 w-5 shrink-0 rounded border-2 transition-all duration-150",
            "border-slate-300 dark:border-slate-700",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
            "focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white",
            "data-[state=indeterminate]:bg-blue-600 data-[state=indeterminate]:border-blue-600 data-[state=indeterminate]:text-white",
            "hover:border-slate-400 dark:hover:border-slate-600",
            "data-[state=checked]:hover:bg-blue-700 data-[state=checked]:hover:border-blue-700",
            className
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
            {props.checked === "indeterminate" ? (
                <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
));

Checkbox.displayName = "Checkbox";

