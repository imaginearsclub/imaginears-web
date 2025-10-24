import { prisma } from "@/lib/prisma";
import { Wrench, Clock } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getMaintenanceInfo() {
    try {
        const settings = await prisma.appSettings.findUnique({
            where: { id: "global" },
            select: { maintenance: true, siteName: true }
        });

        const maintenance = settings?.maintenance as any;
        return {
            message: maintenance?.message || "We'll be back soon!",
            siteName: settings?.siteName || "Imaginears"
        };
    } catch {
        return {
            message: "We'll be back soon!",
            siteName: "Imaginears"
        };
    }
}

export default async function MaintenancePage() {
    const { message, siteName } = await getMaintenanceInfo();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 px-4">
            <div className="max-w-2xl w-full">
                <div className="text-center space-y-8">
                    {/* Icon */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
                            <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-3xl shadow-2xl">
                                <Wrench className="w-20 h-20 text-white animate-pulse" strokeWidth={1.5} />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white">
                            Under Maintenance
                        </h1>
                        <p className="text-2xl text-slate-600 dark:text-slate-300 font-medium">
                            {message}
                        </p>
                    </div>

                    {/* Info Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border-2 border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-center gap-3 text-slate-600 dark:text-slate-400">
                            <Clock className="w-5 h-5" />
                            <p className="text-lg">
                                We're currently performing scheduled maintenance to improve your experience.
                            </p>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">
                            Please check back shortly. Thank you for your patience!
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-8">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            © {new Date().getFullYear()} {siteName}. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

