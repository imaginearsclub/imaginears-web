import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: "ADMIN" | "STAFF";
        } & DefaultSession["user"];
    }
    interface User {
        id: string;
        role: "ADMIN" | "STAFF";
        passwordHash?: string | null;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: "ADMIN" | "STAFF";
        sub?: string;
    }
}
