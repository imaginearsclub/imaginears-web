import { z } from "zod";

/* Shared enums */
export const AgeRanges = ["Under18", "18-24", "25+"] as const;
export const Roles = ["Developer", "Imaginear", "GuestServices"] as const;
export const DevSpecialties = ["FullStack", "Plugin", "Web"] as const;
export const Levels = ["Beginner", "Intermediate", "Advanced"] as const;

export type Role = (typeof Roles)[number];

/**
 * STEP-SAFE BASE SCHEMA
 * - No role-specific required fields here.
 * - This lets react-hook-form validate per step without failing the union.
 */
export const StepSafeSchema = z.object({
    name: z.string().trim().min(2, "Please enter your full name."),
    email: z.string().email("Enter a valid email."),
    mcUsername: z.string().trim().min(2, "Minecraft username is required."),
    confirm16: z.literal(true, { errorMap: () => ({ message: "You must be at least 16." }) }),
    canDiscord: z.boolean(),
    discordUser: z.string().trim().optional(),
    ageRange: z.enum(AgeRanges),
    timezone: z.string().min(1, "Timezone is required."),
    priorStaff: z.boolean(),
    priorServers: z.string().trim().optional(),
    visitedDisney: z.boolean(),
    visitedDetails: z.string().trim().optional(),
    role: z.enum(Roles),

    // Make all role-specific fields OPTIONAL here (step-friendly)
    // Developer
    devPortfolioUrl: z.string().url("Please add a valid URL.").optional(),
    devSpecialty: z.enum(DevSpecialties).optional(),
    devLanguages: z.array(z.string()).optional(),

    // Imaginear
    imgPortfolioUrl: z.string().url("Please add a valid URL.").optional(),
    imgWorldEditLevel: z.enum(Levels).optional(),
    imgPluginFamiliar: z.enum(Levels).optional(),

    // Guest Relations
    grStory: z.string().trim().optional(),
    grValue: z.string().trim().optional(),
    grSuggestions: z.string().trim().optional(),
});

/** STRICT ROLE-SPECIFIC SCHEMAS (used only on submit) */
export const DevFinal = StepSafeSchema.extend({
    role: z.literal("Developer"),
    devPortfolioUrl: z.string().url("Please add a valid URL."),
    devSpecialty: z.enum(DevSpecialties),
    devLanguages: z.array(z.string()).min(1, "Choose at least one language."),
});

export const ImgFinal = StepSafeSchema.extend({
    role: z.literal("Imaginear"),
    imgPortfolioUrl: z.string().url("Please add a valid URL."),
    imgWorldEditLevel: z.enum(Levels),
    imgPluginFamiliar: z.enum(Levels),
});

export const GrFinal = StepSafeSchema.extend({
    role: z.literal("GuestServices"),
    grStory: z.string().trim().min(50, "Please provide more detail (50+ chars)."),
    grValue: z.string().trim().min(40, "Please provide more detail (40+ chars)."),
    grSuggestions: z.string().trim().optional(),
});

/** Helper to get the strict schema by role */
export function schemaForRole(role: Role) {
    switch (role) {
        case "Developer":
            return DevFinal;
        case "Imaginear":
            return ImgFinal;
        case "GuestServices":
            return GrFinal;
    }
}

/** Types */
export type StepSafeInput = z.infer<typeof StepSafeSchema>;
export type DevInput = z.infer<typeof DevFinal>;
export type ImgInput = z.infer<typeof ImgFinal>;
export type GrInput = z.infer<typeof GrFinal>;
export type FinalApplicationInput = DevInput | ImgInput | GrInput;
