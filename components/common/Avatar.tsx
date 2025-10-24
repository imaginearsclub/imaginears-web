"use client";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useState } from "react";

export interface AvatarProps {
  /**
   * Image URL
   */
  src?: string;
  /**
   * Alt text for image
   */
  alt?: string;
  /**
   * Fallback text (usually initials)
   */
  fallback?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Shape variant
   */
  shape?: "circle" | "square";
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Avatar component for displaying user photos with fallback
 * 
 * @example
 * <Avatar src="/user.jpg" alt="John Doe" fallback="JD" />
 * <Avatar fallback="AB" size="lg" />
 * <Avatar src="/user.jpg" shape="square" />
 */
export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  shape = "circle",
  className,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const showImage = src && !imageError;

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden",
        "bg-gradient-to-br from-blue-400 to-purple-500",
        "text-white font-semibold",
        
        // Size variants
        size === "sm" && "h-8 w-8 text-xs",
        size === "md" && "h-10 w-10 text-sm",
        size === "lg" && "h-12 w-12 text-base",
        size === "xl" && "h-16 w-16 text-lg",
        
        // Shape variants
        shape === "circle" && "rounded-full",
        shape === "square" && "rounded-lg",
        
        className
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : fallback ? (
        <span>{fallback}</span>
      ) : (
        <User
          className={cn(
            size === "sm" && "h-4 w-4",
            size === "md" && "h-5 w-5",
            size === "lg" && "h-6 w-6",
            size === "xl" && "h-8 w-8"
          )}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

