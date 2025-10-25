"use client";

import { useState, useEffect, memo } from "react";
import { Badge } from "@/components/common";
import { getCountdownInfo, getCountdownVariant, type EventStatus } from "@/lib/countdown";
import { Clock, Flame, CheckCircle2 } from "lucide-react";

interface CountdownBadgeProps {
    startAt: Date;
    endAt: Date;
    size?: "sm" | "md" | "lg";
    showIcon?: boolean;
    className?: string;
}

/**
 * CountdownBadge - Shows dynamic countdown to/from event
 * Auto-updates every minute to keep the countdown current
 */
const CountdownBadge = memo(({
    startAt,
    endAt,
    size = "sm",
    showIcon = true,
    className,
}: CountdownBadgeProps) => {
    const [now, setNow] = useState(() => Date.now());
    
    // Update countdown every minute
    useEffect(() => {
        // Update immediately on mount
        setNow(Date.now());
        
        // Then update every minute
        const interval = setInterval(() => {
            setNow(Date.now());
        }, 60000); // 60 seconds
        
        return () => clearInterval(interval);
    }, []);
    
    const countdownInfo = getCountdownInfo(startAt, endAt, now);
    const variant = getCountdownVariant(countdownInfo.status);
    
    // Don't show badge for events that ended more than 1 hour ago
    if (countdownInfo.status === "ended" && countdownInfo.timeUntil < -60 * 60 * 1000) {
        return null;
    }
    
    const icon = getIcon(countdownInfo.status);
    
    return (
        <Badge
            variant={variant}
            size={size}
            {...(className && { className })}
            aria-live="polite"
            aria-label={`Event status: ${countdownInfo.label}`}
        >
            {showIcon && icon && (
                <span className="mr-1" aria-hidden="true">
                    {icon}
                </span>
            )}
            {countdownInfo.label}
        </Badge>
    );
});

CountdownBadge.displayName = 'CountdownBadge';

/**
 * Get icon based on event status
 */
function getIcon(status: EventStatus): React.ReactNode {
    switch (status) {
        case "happening-now":
            return <Flame className="w-3 h-3 inline" />;
        case "starting-soon":
            return <Clock className="w-3 h-3 inline animate-pulse" />;
        case "ended":
            return <CheckCircle2 className="w-3 h-3 inline" />;
        case "upcoming":
        default:
            return <Clock className="w-3 h-3 inline" />;
    }
}

export default CountdownBadge;

