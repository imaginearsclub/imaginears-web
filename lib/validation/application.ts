import { z } from "zod";

/* Shared enums - frozen to prevent tampering */
export const AgeRanges = Object.freeze(["Under18", "18-24", "25+"] as const);
export const Roles = Object.freeze(["Developer", "Imaginear", "GuestServices"] as const);
export const DevSpecialties = Object.freeze(["FullStack", "Plugin", "Web"] as const);
export const Levels = Object.freeze(["Beginner", "Intermediate", "Advanced"] as const);

export type Role = (typeof Roles)[number];

// Control character detection regex (null bytes, etc.)
const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/;

// Blocked URL patterns for security
const BLOCKED_HOSTS = /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.0\.0\.0|::1|169\.254\.)/i;

// Reusable url validator that only allows http/https and blocks dangerous URLs
const httpUrl = z
  .string()
  .trim()
  .max(2048, "URL is too long.") // Prevent extremely long URLs
  .refine((val) => !CONTROL_CHARS.test(val), { message: "URL contains invalid characters." })
  .pipe(z.url({ message: "Please add a valid URL." }))
  .refine((val) => {
    try {
      const u = new URL(val);
      // Only allow http/https protocols
      if (u.protocol !== "http:" && u.protocol !== "https:") return false;
      // Block localhost, private IPs, and link-local addresses
      if (BLOCKED_HOSTS.test(u.hostname)) return false;
      // Block suspicious ports that might indicate SSRF
      const port = u.port ? parseInt(u.port, 10) : null;
      if (port && (port < 80 || port > 65535 || [22, 23, 25, 445, 3389].includes(port))) return false;
      return true;
    } catch {
      return false;
    }
  }, { message: "Invalid or unsafe URL." });

// Helper to uniq + sanitize string arrays
function uniqTrimmed(arr: string[]): string[] {
  if (!Array.isArray(arr) || arr.length === 0) return [];
  
  const seen = new Set<string>();
  const out: string[] = [];
  
  for (const raw of arr) {
    if (typeof raw !== "string") continue; // Type guard
    const s = raw.trim();
    if (!s || s.length > 64) continue; // Skip empty or too long
    if (CONTROL_CHARS.test(s)) continue; // Skip strings with control chars
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}

// Validate text fields don't contain control characters
function safeText(max: number, fieldName: string = "This field") {
  return z
    .string()
    .trim()
    .max(max, `${fieldName} is too long (max ${max} characters).`)
    .refine((val) => !CONTROL_CHARS.test(val), {
      message: `${fieldName} contains invalid characters.`,
    });
}

/**
 * BASE SCHEMA WITHOUT REFINEMENTS
 * - This allows extending for role-specific schemas
 */
const BaseSchema = z.object({
  name: safeText(100, "Name")
    .min(2, "Please enter your full name.")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes."),
  
  email: z
    .string()
    .trim()
    .max(254, "Email is too long.") // RFC 5321 max length
    .refine((val) => !CONTROL_CHARS.test(val), { message: "Email contains invalid characters." })
    .pipe(z.email({ message: "Enter a valid email." }))
    .transform((s) => s.toLowerCase())
    .refine((email) => {
      // Block disposable/temporary email domains
      const disposableDomains = ["tempmail.com", "throwaway.email", "guerrillamail.com", "10minutemail.com"];
      const domain = email.split("@")[1];
      return domain ? !disposableDomains.includes(domain) : true;
    }, { message: "Disposable email addresses are not allowed." }),
  
  mcUsername: z
    .string()
    .trim()
    .min(2, "Minecraft username is required.")
    .max(16, "Minecraft username must be 16 characters or less.") // Mojang max length
    .regex(/^[a-zA-Z0-9_]+$/, "Minecraft username can only contain letters, numbers, and underscores."),
  
  confirm16: z.literal(true, { message: "You must be at least 16." }),
  canDiscord: z.boolean(),
  
  discordUser: z
    .string()
    .trim()
    .max(37, "Discord username is too long.") // Discord max: 32 + 5 for discriminator
    .regex(/^[a-zA-Z0-9_.#]+$/, "Invalid Discord username format.")
    .optional(),
  
  ageRange: z.enum(AgeRanges),
  
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required.")
    .max(64)
    .regex(/^[A-Za-z0-9_\/+\-]+$/, "Invalid timezone format."), // Removed \s to be stricter
  
  priorStaff: z.boolean(),
  priorServers: safeText(500, "Prior servers").optional(),
  visitedDisney: z.boolean(),
  visitedDetails: safeText(500, "Disney visit details").optional(),
  role: z.enum(Roles),

  // Make all role-specific fields OPTIONAL here (step-friendly)
  // Developer
  devPortfolioUrl: httpUrl.optional(),
  devSpecialty: z.enum(DevSpecialties).optional(),
  devLanguages: z
    .array(z.string().trim().min(1).max(32))
    .max(10, "Too many languages selected.")
    .transform((a) => uniqTrimmed(a))
    .optional(),

  // Imaginear
  imgPortfolioUrl: httpUrl.optional(),
  imgWorldEditLevel: z.enum(Levels).optional(),
  imgPluginFamiliar: z.enum(Levels).optional(),

  // Guest Relations
  grStory: safeText(4000, "Story").optional(),
  grValue: safeText(4000, "Value").optional(),
  grSuggestions: safeText(2000, "Suggestions").optional(),
});

/**
 * STEP-SAFE SCHEMA WITH REFINEMENTS
 * - Used for react-hook-form validation during multi-step flow
 */
export const StepSafeSchema = BaseSchema.superRefine((data, ctx) => {
  // If canDiscord, require a discordUser
  if (data.canDiscord && (!data.discordUser || data.discordUser.length < 2)) {
    ctx.addIssue({
      code: "custom",
      path: ["discordUser"],
      message: "Please provide your Discord username.",
    });
  }
  // If prior staff, ask where
  if (data.priorStaff && !data.priorServers) {
    ctx.addIssue({
      code: "custom",
      path: ["priorServers"],
      message: "Please list your prior server(s).",
    });
  }
  // If visited Disney, ask details
  if (data.visitedDisney && !data.visitedDetails) {
    ctx.addIssue({
      code: "custom",
      path: ["visitedDetails"],
      message: "Please share details about your visit(s).",
    });
  }
  // Age/consent coherence: if Under18, block proceed
  if (data.ageRange === "Under18") {
    ctx.addIssue({
      code: "custom",
      path: ["ageRange"],
      message: "Applicants must be at least 16.",
    });
  }
});

/** STRICT ROLE-SPECIFIC SCHEMAS (used only on submit) */
export const DevFinal = BaseSchema.extend({
  role: z.literal("Developer"),
  devPortfolioUrl: httpUrl,
  devSpecialty: z.enum(DevSpecialties),
  devLanguages: z
    .array(z.string().trim().min(1).max(32))
    .min(1, "Choose at least one language.")
    .max(10, "Too many languages selected.")
    .transform((a) => uniqTrimmed(a)),
}).superRefine((data, ctx) => {
  // Apply base refinements
  if (data.canDiscord && (!data.discordUser || data.discordUser.length < 2)) {
    ctx.addIssue({ code: "custom", path: ["discordUser"], message: "Please provide your Discord username." });
  }
  if (data.priorStaff && !data.priorServers) {
    ctx.addIssue({ code: "custom", path: ["priorServers"], message: "Please list your prior server(s)." });
  }
  if (data.visitedDisney && !data.visitedDetails) {
    ctx.addIssue({ code: "custom", path: ["visitedDetails"], message: "Please share details about your visit(s)." });
  }
  if (data.ageRange === "Under18") {
    ctx.addIssue({ code: "custom", path: ["ageRange"], message: "Applicants must be at least 16." });
  }
});

export const ImgFinal = BaseSchema.extend({
  role: z.literal("Imaginear"),
  imgPortfolioUrl: httpUrl,
  imgWorldEditLevel: z.enum(Levels),
  imgPluginFamiliar: z.enum(Levels),
}).superRefine((data, ctx) => {
  // Apply base refinements
  if (data.canDiscord && (!data.discordUser || data.discordUser.length < 2)) {
    ctx.addIssue({ code: "custom", path: ["discordUser"], message: "Please provide your Discord username." });
  }
  if (data.priorStaff && !data.priorServers) {
    ctx.addIssue({ code: "custom", path: ["priorServers"], message: "Please list your prior server(s)." });
  }
  if (data.visitedDisney && !data.visitedDetails) {
    ctx.addIssue({ code: "custom", path: ["visitedDetails"], message: "Please share details about your visit(s)." });
  }
  if (data.ageRange === "Under18") {
    ctx.addIssue({ code: "custom", path: ["ageRange"], message: "Applicants must be at least 16." });
  }
});

export const GrFinal = BaseSchema.extend({
  role: z.literal("GuestServices"),
  grStory: safeText(4000, "Story")
    .min(50, "Please provide more detail (50+ chars)."),
  grValue: safeText(4000, "Value")
    .min(40, "Please provide more detail (40+ chars)."),
  grSuggestions: safeText(2000, "Suggestions").optional(),
}).superRefine((data, ctx) => {
  // Apply base refinements
  if (data.canDiscord && (!data.discordUser || data.discordUser.length < 2)) {
    ctx.addIssue({ code: "custom", path: ["discordUser"], message: "Please provide your Discord username." });
  }
  if (data.priorStaff && !data.priorServers) {
    ctx.addIssue({ code: "custom", path: ["priorServers"], message: "Please list your prior server(s)." });
  }
  if (data.visitedDisney && !data.visitedDetails) {
    ctx.addIssue({ code: "custom", path: ["visitedDetails"], message: "Please share details about your visit(s)." });
  }
  if (data.ageRange === "Under18") {
    ctx.addIssue({ code: "custom", path: ["ageRange"], message: "Applicants must be at least 16." });
  }
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
