/**
 * Guest Favorites - localStorage utility
 * Allows guests to favorite events without authentication
 */

const FAVORITES_KEY = "imaginears_favorite_events";
const MAX_FAVORITES = 50; // Prevent abuse

/**
 * Get all favorite event IDs
 */
export function getFavorites(): string[] {
    if (typeof window === "undefined") return [];
    
    try {
        const stored = localStorage.getItem(FAVORITES_KEY);
        if (!stored) return [];
        
        const favorites = JSON.parse(stored);
        if (!Array.isArray(favorites)) return [];
        
        // Validate and limit
        return favorites
            .filter(id => typeof id === "string" && id.length < 100)
            .slice(0, MAX_FAVORITES);
    } catch (error) {
        console.error("[Favorites] Error reading favorites:", error);
        return [];
    }
}

/**
 * Check if an event is favorited
 */
export function isFavorite(eventId: string): boolean {
    const favorites = getFavorites();
    return favorites.includes(eventId);
}

/**
 * Add event to favorites
 */
export function addFavorite(eventId: string): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const favorites = getFavorites();
        
        // Check if already favorited
        if (favorites.includes(eventId)) return true;
        
        // Check limit
        if (favorites.length >= MAX_FAVORITES) {
            console.warn("[Favorites] Maximum favorites reached");
            return false;
        }
        
        // Add to favorites
        const updated = [...favorites, eventId];
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        
        // Dispatch custom event for other components to listen
        window.dispatchEvent(new CustomEvent("favoritesChanged", { 
            detail: { eventId, action: "add" } 
        }));
        
        return true;
    } catch (error) {
        console.error("[Favorites] Error adding favorite:", error);
        return false;
    }
}

/**
 * Remove event from favorites
 */
export function removeFavorite(eventId: string): boolean {
    if (typeof window === "undefined") return false;
    
    try {
        const favorites = getFavorites();
        const updated = favorites.filter(id => id !== eventId);
        
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent("favoritesChanged", { 
            detail: { eventId, action: "remove" } 
        }));
        
        return true;
    } catch (error) {
        console.error("[Favorites] Error removing favorite:", error);
        return false;
    }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(eventId: string): boolean {
    const isCurrentlyFavorite = isFavorite(eventId);
    
    if (isCurrentlyFavorite) {
        return removeFavorite(eventId);
    } else {
        return addFavorite(eventId);
    }
}

/**
 * Get favorite count
 */
export function getFavoriteCount(): number {
    return getFavorites().length;
}

/**
 * Clear all favorites
 */
export function clearFavorites(): void {
    if (typeof window === "undefined") return;
    
    try {
        localStorage.removeItem(FAVORITES_KEY);
        window.dispatchEvent(new CustomEvent("favoritesChanged", { 
            detail: { action: "clear" } 
        }));
    } catch (error) {
        console.error("[Favorites] Error clearing favorites:", error);
    }
}

