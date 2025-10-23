import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { organization } from "better-auth/plugins";
import { env } from "@/lib/env";

// Build a safe baseURL. In production, require a valid HTTPS origin.
const baseURL: string | undefined = (() => {
  const raw = env.BETTER_AUTH_URL?.trim();
  const nodeEnv = env.NODE_ENV;
  if (!raw) {
    if (nodeEnv === "production") {
      throw new Error("BETTER_AUTH_URL is required in production and must be an absolute https URL");
    }
    return undefined;
  }
  // Parse once; avoid throwing inside try so we don't mask specific errors.
  let parsed: URL | null = null;
  try {
    parsed = new URL(raw);
  } catch {
    parsed = null;
  }
  if (!parsed) {
    if (nodeEnv === "production") {
      throw new Error("Invalid BETTER_AUTH_URL. Expected absolute https URL");
    }
    // In non‑prod, fall back to the provided string to keep DX flexible
    return raw;
  }
  if (nodeEnv === "production" && parsed.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use https in production");
  }
  // Only pass the origin to avoid path/query surprises.
  return parsed.origin;
})();

// Org creation policy: default to disallowing arbitrary org creation unless explicitly enabled.
const allowOrgCreation = /^true|1$/i.test(env.ALLOW_ORG_CREATION ?? "");
// Export a readable flag so UI/server actions can gate org creation without triggering API errors.
export const canUsersCreateOrganizations = allowOrgCreation;

// Note: Better-Auth stores credential passwords on the Account table (field `password`),
// not on User.passwordHash. Seeing User.passwordHash = null is expected.
export const auth = betterAuth({
  ...(baseURL && { baseURL }),
  database: prismaAdapter(prisma, { provider: "mysql" }),
  secret: env.BETTER_AUTH_SECRET,

  // Enhanced session security
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Use email and password; you can add Discord too.
  emailAndPassword: { 
    enabled: true,
    requireEmailVerification: env.NODE_ENV === "production",
  },

  socialProviders: env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET
    ? {
        discord: {
          clientId: env.DISCORD_CLIENT_ID,
          clientSecret: env.DISCORD_CLIENT_SECRET,
        },
      }
    : {},

  // Enhanced security features
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: false, // Security: Don't share cookies across subdomains
    },
    useSecureCookies: env.NODE_ENV === "production",
  },

  plugins: [
    organization({
      // Enable Teams if you want subgroups.
      teams: { enabled: true },
      // Allow creation when globally enabled, or always for the owner "Clarkcj"; additionally allow bootstrap when no orgs exist.
      allowUserToCreateOrganization: async (user) => {
        if (allowOrgCreation) return true;
        const name = (user?.name ?? "").toString().toLowerCase();
        const username = (user as any)?.username ? String((user as any).username).toLowerCase() : "";
        const email = (user?.email ?? "").toString().toLowerCase();
        const isOwner = name === "clarkcj" || username === "clarkcj" || email.startsWith("clarkcj");
        if (isOwner) return true; // owner can always create
        try {
          const count = await prisma.organization.count();
          if (count === 0 && isOwner) {
            return true;
          }
        } catch {}
        return false;
      },
    }),
  ],
});
