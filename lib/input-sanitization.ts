/**
 * Input Sanitization Utilities
 * 
 * Prevents XSS attacks and ensures data integrity
 */

/**
 * Sanitize user input by removing dangerous characters and limiting length
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default 255)
 * @returns Sanitized string
 */
export function sanitizeInput(input: string | null | undefined, maxLength: number = 255): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove HTML brackets to prevent basic XSS
    .slice(0, maxLength);
}

/**
 * Sanitize HTML content by encoding special characters
 * Use for content that will be displayed as HTML
 * @param input - Raw HTML string
 * @returns HTML-encoded string
 */
export function sanitizeHTML(input: string | null | undefined): string {
  if (!input) return "";
  
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Normalize email address (lowercase, trimmed)
 * @param email - Raw email input
 * @returns Normalized email
 */
export function normalizeEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

/**
 * Sanitize Minecraft username
 * @param username - Raw username
 * @returns Sanitized username (alphanumeric + underscores only)
 */
export function sanitizeMinecraftName(username: string | null | undefined): string {
  if (!username) return "";
  return username.trim().replace(/[^a-zA-Z0-9_]/g, "").slice(0, 16);
}

/**
 * Sanitize role slug (lowercase alphanumeric + hyphens/underscores)
 * @param slug - Raw slug
 * @returns Sanitized slug
 */
export function sanitizeSlug(slug: string | null | undefined): string {
  if (!slug) return "";
  return slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 50);
}

/**
 * Remove all whitespace from a string (useful for tokens, IDs)
 * @param input - Raw input
 * @returns String with no whitespace
 */
export function removeWhitespace(input: string | null | undefined): string {
  if (!input) return "";
  return input.replace(/\s/g, "");
}

/**
 * Sanitize description/long text fields
 * Allows most characters but limits length and removes dangerous content
 * @param input - Raw description
 * @param maxLength - Maximum length (default 1000)
 * @returns Sanitized description
 */
export function sanitizeDescription(input: string | null | undefined, maxLength: number = 1000): string {
  if (!input) return "";
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove iframes
    .replace(/on\w+="[^"]*"/gi, "") // Remove inline event handlers
    .slice(0, maxLength);
}

/**
 * Validate and sanitize URL
 * @param url - Raw URL
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return "";
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  
  return "";
}

