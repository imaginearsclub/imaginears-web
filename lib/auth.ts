import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { organization } from "better-auth/plugins";

// Build a safe baseURL. In production, require a valid HTTPS origin.
const baseURL: string | undefined = (() => {
  const raw = process.env.BETTER_AUTH_URL?.trim();
  const env = process.env.NODE_ENV;
  if (!raw) {
    if (env === "production") {
      throw new Error("BETTER_AUTH_URL is required in production and must be an absolute https URL");
    }
    return undefined;
  }
  try {
    const u = new URL(raw);
    if (env === "production" && u.protocol !== "https:") {
      throw new Error("BETTER_AUTH_URL must use https in production");
    }
    // Only pass the origin to avoid path/query surprises.
    return u.origin;
  } catch {
    if (env === "production") {
      throw new Error("Invalid BETTER_AUTH_URL. Expected absolute https URL");
    }
    // In non‑prod, fall back to the provided string to keep DX flexible
    return raw;
  }
})();

// Org creation policy: default to disallowing arbitrary org creation unless explicitly enabled.
const allowOrgCreation = /^true|1$/i.test(process.env.ALLOW_ORG_CREATION ?? "");

export const auth = betterAuth({
  baseURL,
  database: prismaAdapter(prisma, { provider: "mysql" }),

  // Use email and password; you can add Discord too.
  emailAndPassword: { enabled: true },

  socialProviders: {
    discord:
      process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
        ? {
            clientId: process.env.DISCORD_CLIENT_ID!,
            clientSecret: process.env.DISCORD_CLIENT_SECRET!,
          }
        : undefined,
  },

  plugins: [
    organization({
      // Enable Teams if you want sub-groups.
      teams: { enabled: true },
      // Prevent random users from creating orgs unless explicitly allowed via env.
      allowUserToCreateOrganization: allowOrgCreation,
    }),
  ],
});
