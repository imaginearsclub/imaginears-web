import "server-only";
import { PrismaClient, type Prisma } from "@prisma/client";

/**
 * Prisma client singleton with hardening and graceful shutdown.
 * - Avoids multiple instances during Next.js HMR in dev.
 * - Edge-safe: exports a stub on Edge runtime to avoid crashes in middleware/imports.
 * - Configurable log levels via PRISMA_LOG_LEVEL (comma-separated), sensible defaults per env.
 * - Registers process shutdown hooks to disconnect cleanly.
 */

// Detect Edge runtime (e.g., Middleware). Prisma is not supported there.
const isEdge = typeof (globalThis as any).EdgeRuntime !== "undefined" || process.env.NEXT_RUNTIME === "edge";

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

const globalForPrisma = globalThis as unknown as {
    prisma?: PrismaClient;
    __prisma_shutdown_hooks_registered?: boolean;
};

function registerShutdownHooksOnce(client: PrismaClient) {
    if (globalForPrisma.__prisma_shutdown_hooks_registered) return;
    globalForPrisma.__prisma_shutdown_hooks_registered = true;

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

// Export an Edge-safe stub that throws on use, but does not crash on import
function createEdgePrismaStub(): PrismaClient {
    const handler: any = new Proxy(
        {},
        {
            get() {
                throw new Error(
                    "Prisma Client cannot be used in the Edge runtime. Ensure any code that calls the database runs on the Node.js runtime (e.g., server actions, route handlers, or server components) and avoid importing DB modules in Middleware."
                );
            },
            apply() {
                throw new Error(
                    "Prisma Client cannot be used in the Edge runtime."
                );
            },
        }
    );
    return handler as PrismaClient;
}

export const prisma: PrismaClient = isEdge
    ? createEdgePrismaStub()
    : (globalForPrisma.prisma ??
        new PrismaClient({
            log: logLevels,
            errorFormat,
        }));

if (!isEdge) {
    registerShutdownHooksOnce(prisma);
    if (!isProd) {
        globalForPrisma.prisma = prisma;
    }
}
