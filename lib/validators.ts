import { z } from "zod";

// Use const assertions to avoid type widening and improve inference
export const RoleEnum = z.enum(["Developer", "Guest Services", "Imaginear"] as const);
export const AppStatusEnum = z.enum(["Pending", "Approved", "Denied"] as const);

// Reusable validated field types for consistency and performance
const UsernameSchema = z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters")
    .max(32, "Username must not exceed 32 characters")
    // Allow alphanumeric, underscores, hyphens, spaces (common username patterns)
    // Prevents control characters, null bytes, and special chars that could cause issues
    .regex(/^[a-zA-Z0-9_\- ]+$/, "Username must contain only letters, numbers, spaces, underscores, and hyphens");

const DiscordUsernameSchema = z
    .string()
    .trim()
    .min(2, "Discord username must be at least 2 characters")
    .max(37, "Discord username must not exceed 37 characters") // Discord max is 32 + 5 for discriminator/display
    // Allow Discord's username format: alphanumeric, underscores, periods, and legacy discriminators (#1234)
    .regex(/^[a-zA-Z0-9_.#]+$/, "Invalid Discord username format");

const NotesSchema = z
    .string()
    .trim()
    .max(2000, "Notes must not exceed 2000 characters")
    // Reject null bytes and other control characters that could cause issues
    .refine((val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
        message: "Notes contain invalid control characters",
    });

const SearchQuerySchema = z
    .string()
    .trim()
    .min(1)
    .max(100, "Search query too long") // Prevent DoS with extremely long queries
    // Reject control characters and null bytes
    .refine((val) => !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(val), {
        message: "Search query contains invalid characters",
    });

// Answer value validation - more specific than z.unknown()
const AnswerValueSchema = z.union([
    z.string().max(5000), // Text answers capped at reasonable length
    z.number().finite(), // Reject Infinity/NaN
    z.boolean(),
    z.array(z.string().max(500)).max(50), // Array of strings (e.g., multi-select)
    z.null(),
]);

export const ApplicationCreateSchema = z
    .object({
        username: UsernameSchema,
        discord: DiscordUsernameSchema,
        role: RoleEnum,
        // More specific validation than z.unknown() - prevents malicious payloads
        answers: z.record(z.string().max(200), AnswerValueSchema).default({}),
        notes: NotesSchema.optional(),
    })
    .strict(); // Reject unknown fields to prevent prototype pollution and reduce payload size

export const ApplicationUpdateSchema = z
    .object({
        status: AppStatusEnum.optional(),
        notes: NotesSchema.optional(),
    })
    .strict(); // Reject unknown fields

export const ListQuerySchema = z
    .object({
        q: SearchQuerySchema.optional(),
        role: RoleEnum.or(z.literal("All")).optional(),
        status: AppStatusEnum.or(z.literal("All")).optional(),
        page: z.coerce.number().int().min(1).max(10000).default(1), // Cap max page to prevent enumeration
        pageSize: z.coerce.number().int().min(1).max(100).default(20),
    })
    .strict(); // Reject unknown query parameters
