import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * Prisma client singleton with hardening and graceful shutdown.
 * - Avoids multiple instances during Next.js HMR in dev.
 * - Throws early if imported on the Edge runtime (Prisma doesn't support Edge).
 * - Configurable log levels via PRISMA_LOG_LEVEL (comma-separated), sensible defaults per env.
 * - Registers process shutdown hooks to disconnect cleanly.
 */

// Guard against accidental Edge runtime usage
const isEdge = typeof (globalThis as any).EdgeRuntime !== "undefined" || process.env.NEXT_RUNTIME === "edge";
if (isEdge) {
    // Using Prisma on the Edge runtime is unsupported and will crash at runtime.
    throw new Error("Prisma Client cannot be used in the Edge runtime. Move this code to the Node.js runtime or a server action/route running on Node.");
}

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

function parseLogEnv(): Prisma.LogLevel[] | undefined {
    const raw = process.env.PRISMA_LOG_LEVEL;
    if (!raw) return undefined;
    const allowed: Prisma.LogLevel[] = ["query", "info", "warn", "error"];
    const set = new Set(
        raw
            .split(",")
            .map((s) => s.trim())
            .filter((s): s is Prisma.LogLevel => (allowed as readonly string[]).includes(s))
    );
    return set.size ? (Array.from(set) as Prisma.LogLevel[]) : undefined;
}

const logLevels: Prisma.LogLevel[] =
    parseLogEnv() ?? (isDev ? ["query", "info", "warn", "error"] : ["error"]);

const errorFormat: "pretty" | "colorless" | "minimal" = isProd ? "minimal" : "pretty";

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
    // eslint-disable-next-line no-var
    var __prisma_shutdown_hooks_registered: boolean | undefined;
}

function registerShutdownHooksOnce(client: PrismaClient) {
    if (globalThis.__prisma_shutdown_hooks_registered) return;
    globalThis.__prisma_shutdown_hooks_registered = true;

    const disconnect = async () => {
        try {
            await client.$disconnect();
        } catch {
            // Ignore errors during shutdown
        }
    };

    if (typeof process !== "undefined" && process?.on) {
        process.on("beforeExit", disconnect);
        // Common termination signals in most environments
        process.on("SIGINT", async () => {
            await disconnect();
            process.exit(0);
        });
        process.on("SIGTERM", async () => {
            await disconnect();
            process.exit(0);
        });
    }
}

export const prisma =
    globalThis.prisma ??
    new PrismaClient({
        log: logLevels,
        errorFormat,
    });

registerShutdownHooksOnce(prisma);

if (!isProd) {
    globalThis.prisma = prisma;
}
