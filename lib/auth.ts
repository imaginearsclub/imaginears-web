import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { organization } from "better-auth/plugins";

export const auth = betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
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
            // (Optional) prevent random users from creating orgs:
            // allowUserToCreateOrganization: false,
        }),
    ],
});
