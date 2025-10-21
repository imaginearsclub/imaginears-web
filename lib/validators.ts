import { z } from "zod";

export const RoleEnum = z.enum(["Developer", "Guest Services", "Imaginear"]);
export const AppStatusEnum = z.enum(["Pending", "Approved", "Denied"]);

export const ApplicationCreateSchema = z.object({
    username: z.string().min(2),
    discord: z.string().min(2),
    role: RoleEnum,
    answers: z.record(z.any()).default({}),
    notes: z.string().optional(),
});

export const ApplicationUpdateSchema = z.object({
    status: AppStatusEnum.optional(),
    notes: z.string().optional(),
});

export const ListQuerySchema = z.object({
    q: z.string().optional(),
    role: RoleEnum.or(z.literal("All")).optional(),
    status: AppStatusEnum.or(z.literal("All")).optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
});
