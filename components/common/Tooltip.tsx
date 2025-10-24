"use client";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";
import { type ReactNode } from "react";

/**
 * Tooltip provider - wrap your app or section with this
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Simple tooltip component with sensible defaults
 */
export function Tooltip({
    children,
    content,
    side = "top",
    align = "center",
    delayDuration = 300,
    className,
}: {
    children: ReactNode;
    content: ReactNode;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
    delayDuration?: number;
    className?: string;
}) {
    return (
        <TooltipPrimitive.Root delayDuration={delayDuration}>
            <TooltipPrimitive.Trigger asChild>
                {children}
            </TooltipPrimitive.Trigger>
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Content
                    side={side}
                    align={align}
                    className={cn(
                        "z-50 overflow-hidden rounded-lg px-3 py-1.5",
                        "bg-slate-900 dark:bg-slate-700",
                        "text-xs font-medium text-white",
                        "shadow-lg border border-slate-800 dark:border-slate-600",
                        "animate-in fade-in-0 zoom-in-95",
                        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
                        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
                        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                        className
                    )}
                    sideOffset={5}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="fill-slate-900 dark:fill-slate-700" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}

