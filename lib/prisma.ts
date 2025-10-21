import { PrismaClient } from "@prisma/client";

/**
 * Prevents creating multiple PrismaClient instances during hot reloads in dev.
 * In production, a single client is created once per Lambda / server process.
 */

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma =
    globalThis.prisma ??
    new PrismaClient({
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "info", "warn", "error"]
                : ["error"],
    });

if (process.env.NODE_ENV !== "production") {
    globalThis.prisma = prisma;
}
