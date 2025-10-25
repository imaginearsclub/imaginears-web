"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { Button } from "@/components/common";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

interface FavoriteButtonProps {
    eventId: string;
    eventTitle?: string;
    size?: "sm" | "md" | "lg";
    variant?: "default" | "outline" | "ghost";
    showLabel?: boolean;
    className?: string;
}

const FavoriteButton = memo(({
    eventId,
    eventTitle,
    size = "sm",
    variant = "ghost",
    showLabel = false,
    className,
}: FavoriteButtonProps) => {
    const [favorited, setFavorited] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Check if favorited on mount
    useEffect(() => {
        setFavorited(isFavorite(eventId));
    }, [eventId]);

    // Listen for favorites changes from other components
    useEffect(() => {
        const handleFavoritesChanged = (event: Event) => {
            const customEvent = event as CustomEvent;
            const { eventId: changedId, action } = customEvent.detail;
            
            if (changedId === eventId) {
                setFavorited(action === "add");
            } else if (action === "clear") {
                setFavorited(false);
            }
        };

        window.addEventListener("favoritesChanged", handleFavoritesChanged);
        return () => window.removeEventListener("favoritesChanged", handleFavoritesChanged);
    }, [eventId]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const success = toggleFavorite(eventId);
        
        if (success) {
            setFavorited(prev => !prev);
            setIsAnimating(true);
            setTimeout(() => setIsAnimating(false), 300);
        }
    }, [eventId]);

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleClick}
            className={cn(
                "gap-2 transition-all duration-200",
                className
            )}
            aria-label={favorited ? `Remove ${eventTitle || 'event'} from favorites` : `Add ${eventTitle || 'event'} to favorites`}
            aria-pressed={favorited}
        >
            <Heart
                className={cn(
                    "transition-all duration-200",
                    size === "sm" && "w-4 h-4",
                    size === "md" && "w-5 h-5",
                    size === "lg" && "w-6 h-6",
                    favorited && "fill-red-500 text-red-500",
                    !favorited && "fill-none",
                    isAnimating && "scale-125"
                )}
                aria-hidden="true"
            />
            {showLabel && (
                <span className="hidden sm:inline">
                    {favorited ? "Favorited" : "Favorite"}
                </span>
            )}
        </Button>
    );
});

FavoriteButton.displayName = 'FavoriteButton';

export default FavoriteButton;

