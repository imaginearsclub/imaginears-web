import { z } from "zod";

/* Shared enums */
export const AgeRanges = ["Under18", "18-24", "25+"] as const;
export const Roles = ["Developer", "Imaginear", "GuestServices"] as const;
export const DevSpecialties = ["FullStack", "Plugin", "Web"] as const;
export const Levels = ["Beginner", "Intermediate", "Advanced"] as const;

export type Role = (typeof Roles)[number];

// Reusable url validator that only allows http/https
const httpUrl = z
  .string()
  .trim()
  .url("Please add a valid URL.")
  .refine((val) => {
    try {
      const u = new URL(val);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }, { message: "URL must start with http:// or https://" });

// Helper to uniq + sanitize string arrays
function uniqTrimmed(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const s = raw.trim();
    if (!s) continue;
    if (s.length > 64) continue; // clamp per-item length
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

/**
 * STEP-SAFE BASE SCHEMA
 * - No role-specific required fields here.
 * - This lets react-hook-form validate per step without failing the union.
 */
export const StepSafeSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(100),
    email: z.string().trim().email("Enter a valid email.").transform((s) => s.toLowerCase()),
    mcUsername: z.string().trim().min(2, "Minecraft username is required.").max(32),
    confirm16: z.literal(true, { message: "You must be at least 16." }),
    canDiscord: z.boolean(),
    discordUser: z.string().trim().max(64).optional(),
    ageRange: z.enum(AgeRanges),
    timezone: z
      .string()
      .trim()
      .min(1, "Timezone is required.")
      .max(64)
      .regex(/^[A-Za-z0-9_\/+\-\s]+$/, "Invalid timezone format"),
    priorStaff: z.boolean(),
    priorServers: z.string().trim().max(500).optional(),
    visitedDisney: z.boolean(),
    visitedDetails: z.string().trim().max(500).optional(),
    role: z.enum(Roles),

    // Make all role-specific fields OPTIONAL here (step-friendly)
    // Developer
    devPortfolioUrl: httpUrl.optional(),
    devSpecialty: z.enum(DevSpecialties).optional(),
    devLanguages: z
      .array(z.string().trim().min(1).max(32))
      .max(10)
      .transform((a) => uniqTrimmed(a))
      .optional(),

    // Imaginear
    imgPortfolioUrl: httpUrl.optional(),
    imgWorldEditLevel: z.enum(Levels).optional(),
    imgPluginFamiliar: z.enum(Levels).optional(),

    // Guest Relations
    grStory: z.string().trim().max(2000).optional(),
    grValue: z.string().trim().max(2000).optional(),
    grSuggestions: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    // If canDiscord, require a discordUser
    if (data.canDiscord && (!data.discordUser || data.discordUser.length < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discordUser"],
        message: "Please provide your Discord username.",
      });
    }
    // If prior staff, ask where
    if (data.priorStaff && !data.priorServers) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["priorServers"],
        message: "Please list your prior server(s).",
      });
    }
    // If visited Disney, ask details
    if (data.visitedDisney && !data.visitedDetails) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["visitedDetails"],
        message: "Please share details about your visit(s).",
      });
    }
    // Age/consent coherence: if Under18, block proceed
    if (data.ageRange === "Under18") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ageRange"],
        message: "Applicants must be at least 16.",
      });
    }
  });

/** STRICT ROLE-SPECIFIC SCHEMAS (used only on submit) */
export const DevFinal = StepSafeSchema.extend({
  role: z.literal("Developer"),
  devPortfolioUrl: httpUrl,
  devSpecialty: z.enum(DevSpecialties),
  devLanguages: z
    .array(z.string().trim().min(1).max(32))
    .min(1, "Choose at least one language.")
    .max(10)
    .transform((a) => uniqTrimmed(a)),
});

export const ImgFinal = StepSafeSchema.extend({
  role: z.literal("Imaginear"),
  imgPortfolioUrl: httpUrl,
  imgWorldEditLevel: z.enum(Levels),
  imgPluginFamiliar: z.enum(Levels),
});

export const GrFinal = StepSafeSchema.extend({
  role: z.literal("GuestServices"),
  grStory: z.string().trim().min(50, "Please provide more detail (50+ chars).").max(4000),
  grValue: z.string().trim().min(40, "Please provide more detail (40+ chars).").max(4000),
  grSuggestions: z.string().trim().max(2000).optional(),
});

/** Helper to get the strict schema by role */
export function schemaForRole(
  role: Role,
): typeof DevFinal | typeof ImgFinal | typeof GrFinal | typeof StepSafeSchema {
  switch (role) {
    case "Developer":
      return DevFinal;
    case "Imaginear":
      return ImgFinal;
    case "GuestServices":
      return GrFinal;
    default:
      return StepSafeSchema;
  }
}

/** Types */
export type StepSafeInput = z.infer<typeof StepSafeSchema>;
export type DevInput = z.infer<typeof DevFinal>;
export type ImgInput = z.infer<typeof ImgFinal>;
export type GrInput = z.infer<typeof GrFinal>;
export type FinalApplicationInput = DevInput | ImgInput | GrInput;
