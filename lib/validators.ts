import { z } from "zod";

// Use const assertions to avoid type widening and improve inference
export const RoleEnum = z.enum(["Developer", "Guest Services", "Imaginear"] as const);
export const AppStatusEnum = z.enum(["Pending", "Approved", "Denied"] as const);

export const ApplicationCreateSchema = z.object({
    username: z.string().trim().min(2).max(32),
    discord: z.string().trim().min(2).max(64),
    role: RoleEnum,
    // In Zod v4, z.record expects key and value schemas; prefer unknown over any for safety
    answers: z.record(z.string(), z.unknown()).default({}),
    notes: z.string().trim().max(2000).optional(),
});

export const ApplicationUpdateSchema = z.object({
    status: AppStatusEnum.optional(),
    notes: z.string().trim().max(2000).optional(),
});

export const ListQuerySchema = z.object({
    q: z.string().trim().min(1).optional(),
    role: RoleEnum.or(z.literal("All")).optional(),
    status: AppStatusEnum.or(z.literal("All")).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
