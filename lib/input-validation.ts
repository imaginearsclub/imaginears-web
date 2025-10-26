/**
 * Input Validation Utilities
 * 
 * Comprehensive validation for all user inputs
 */

/**
 * Maximum allowed lengths for various fields
 */
export const MAX_LENGTHS = {
  NAME: 100,
  EMAIL: 255,
  SHORT_DESCRIPTION: 200,
  DESCRIPTION: 1000,
  LONG_DESCRIPTION: 5000,
  MINECRAFT_NAME: 16,
  PASSWORD: 128,
  SLUG: 50,
  TITLE: 150,
  URL: 2048,
  COLOR: 7, // #RRGGBB
} as const;

/**
 * Minimum allowed lengths
 */
export const MIN_LENGTHS = {
  NAME: 1,
  PASSWORD: 8,
  MINECRAFT_NAME: 3,
  SLUG: 2,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate field length
 */
export function validateLength(
  value: string | null | undefined,
  field: string,
  min: number,
  max: number
): ValidationResult {
  if (!value) {
    return { valid: false, error: `${field} is required` };
  }

  const length = value.trim().length;

  if (length < min) {
    return {
      valid: false,
      error: `${field} must be at least ${min} character${min !== 1 ? "s" : ""}`,
    };
  }

  if (length > max) {
    return {
      valid: false,
      error: `${field} too long (max ${max} characters)`,
    };
  }

  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string | null | undefined): ValidationResult {
  if (!email) {
    return { valid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  if (trimmed.length > MAX_LENGTHS.EMAIL) {
    return { valid: false, error: "Email too long" };
  }

  // RFC 5322 compliant email regex (simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Invalid email format" };
  }

  return { valid: true };
}

/**
 * Validate Minecraft username
 */
export function validateMinecraftName(username: string | null | undefined): ValidationResult {
  if (!username) {
    return { valid: true }; // Optional field
  }

  const trimmed = username.trim();

  if (trimmed.length < MIN_LENGTHS.MINECRAFT_NAME || trimmed.length > MAX_LENGTHS.MINECRAFT_NAME) {
    return {
      valid: false,
      error: `Minecraft username must be ${MIN_LENGTHS.MINECRAFT_NAME}-${MAX_LENGTHS.MINECRAFT_NAME} characters`,
    };
  }

  // Minecraft usernames: alphanumeric and underscores only
  const mcRegex = /^[a-zA-Z0-9_]+$/;
  
  if (!mcRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Minecraft username can only contain letters, numbers, and underscores",
    };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string | null | undefined): ValidationResult {
  if (!password) {
    return { valid: false, error: "Password is required" };
  }

  if (password.length < MIN_LENGTHS.PASSWORD) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_LENGTHS.PASSWORD} characters`,
    };
  }

  if (password.length > MAX_LENGTHS.PASSWORD) {
    return { valid: false, error: "Password too long" };
  }

  // Check for at least one number (optional, can be enabled)
  // if (!/\d/.test(password)) {
  //   return { valid: false, error: "Password must contain at least one number" };
  // }

  return { valid: true };
}

/**
 * Validate slug format
 */
export function validateSlug(slug: string | null | undefined): ValidationResult {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  const trimmed = slug.trim().toLowerCase();

  if (trimmed.length < MIN_LENGTHS.SLUG || trimmed.length > MAX_LENGTHS.SLUG) {
    return {
      valid: false,
      error: `Slug must be ${MIN_LENGTHS.SLUG}-${MAX_LENGTHS.SLUG} characters`,
    };
  }

  // Slug format: lowercase alphanumeric, hyphens, underscores
  const slugRegex = /^[a-z0-9-_]+$/;
  
  if (!slugRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Slug can only contain lowercase letters, numbers, hyphens, and underscores",
    };
  }

  return { valid: true };
}

/**
 * Validate hex color code
 */
export function validateHexColor(color: string | null | undefined): ValidationResult {
  if (!color) {
    return { valid: true }; // Optional field
  }

  const trimmed = color.trim();
  const hexRegex = /^#[0-9A-Fa-f]{6}$/;
  
  if (!hexRegex.test(trimmed)) {
    return { valid: false, error: "Invalid color format (use #RRGGBB)" };
  }

  return { valid: true };
}

/**
 * Validate URL format
 */
export function validateURL(url: string | null | undefined): ValidationResult {
  if (!url) {
    return { valid: true }; // Optional field
  }

  const trimmed = url.trim();

  if (trimmed.length > MAX_LENGTHS.URL) {
    return { valid: false, error: "URL too long" };
  }

  try {
    const parsed = new URL(trimmed);
    
    // Only allow http and https
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, error: "URL must use HTTP or HTTPS protocol" };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

/**
 * Validate JSON string
 */
export function validateJSON(json: string | null | undefined): ValidationResult {
  if (!json) {
    return { valid: false, error: "JSON is required" };
  }

  try {
    JSON.parse(json);
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid JSON format" };
  }
}

/**
 * Validate array is not empty
 */
export function validateNonEmptyArray(arr: unknown, fieldName: string): ValidationResult {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { valid: false, error: `${fieldName} must contain at least one item` };
  }

  return { valid: true };
}

/**
 * Validate number is within range
 */
export function validateNumberRange(
  value: number | null | undefined,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  if (value === null || value === undefined) {
    return { valid: false, error: `${fieldName} is required` };
  }

  if (isNaN(value)) {
    return { valid: false, error: `${fieldName} must be a number` };
  }

  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }

  return { valid: true };
}

/**
 * Batch validate multiple fields
 * Returns first validation error or success
 */
export function validateMultiple(...validations: ValidationResult[]): ValidationResult {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }

  return { valid: true };
}

