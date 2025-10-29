import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ActionBar from "@/components/admin/applications/ApplicationApproveBar";
import type { Application } from "@prisma/client";

export const runtime = "nodejs";

export default async function ApplicationDetailPage({
                                                        params,
                                                    }: { params: Promise<{ id: string }> }) {
    // Next.js 15+: params is now a Promise
    const { id } = await params;
    
    const app = await prisma.application.findUnique({
        where: { id },
    });

    if (!app) return notFound();

    const fmt = new Intl.DateTimeFormat(undefined, {
        year: "numeric", month: "short", day: "2-digit",
        hour: "numeric", minute: "2-digit",
    });

    return (
        <div className="relative p-4 pb-24 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Application Details</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Submitted {fmt.format(app.createdAt)} — Status: <strong>{app.status}</strong>
                </p>
            </div>

            {/* Primary info */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 space-y-3">
                <Row label="Name" value={app.name} />
                <Row label="Email" value={<a className="underline" href={`mailto:${app.email}`}>{app.email}</a>} />
                <Row label="Minecraft Username" value={app.mcUsername} />
                <Row label="Role" value={app.role} />
                <Row label="Timezone" value={app.timezone} />
                <Row label="Age Range" value={app.ageRange} />
            </section>

            <ExperienceSection app={app} />
            <RoleSpecificSection app={app} />

            {/* Internal notes */}
            <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 space-y-3">
                <h2 className="text-lg font-semibold mb-2">Internal Notes</h2>
                <PreWrap text={app.notes || "No notes yet."} />
            </section>

            {/* Sticky approve bar */}
            <ActionBar id={app.id} currentStatus={app.status} />
        </div>
    );
}

function ExperienceSection({ app }: { app: Application }) {
    return (
        <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Experience</h2>
            <Row label="Can use Discord" value={app.canDiscord ? "Yes" : "No"} />
            {app.canDiscord && <Row label="Discord" value={app.discordUser || "—"} />}
            <Row label="Prior staff" value={app.priorStaff ? "Yes" : "No"} />
            {app.priorStaff && <Row label="Servers/IPs" value={app.priorServers || "—"} />}
            <Row label="Visited Disney" value={app.visitedDisney ? "Yes" : "No"} />
            {app.visitedDisney && <Row label="Details" value={app.visitedDetails || "—"} />}
        </section>
    );
}

function RoleSpecificSection({ app }: { app: Application }) {
    return (
        <section className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6 space-y-3">
            <h2 className="text-lg font-semibold mb-2">Role-Specific</h2>

            {app.role === "Developer" && (
                <>
                    <Row label="Portfolio/GitHub" value={linkOrDash(app.devPortfolioUrl)} />
                    <Row label="Specialty" value={app.devSpecialty || "—"} />
                    <Row label="Languages" value={app.devLanguages || "—"} />
                </>
            )}

            {app.role === "Imaginear" && (
                <>
                    <Row label="Portfolio/Showcase" value={linkOrDash(app.imgPortfolioUrl)} />
                    <Row label="WorldEdit" value={app.imgWorldEditLevel || "—"} />
                    <Row label="Plugin Familiarity" value={app.imgPluginFamiliar || "—"} />
                </>
            )}

            {app.role === "GuestServices" && (
                <>
                    <Row label="Above & Beyond Story" value={<PreWrap text={app.grStory || "—"} />} />
                    <Row label="Value to Team" value={<PreWrap text={app.grValue || "—"} />} />
                    <Row label="Suggestions" value={<PreWrap text={app.grSuggestions || "—"} />} />
                </>
            )}
        </section>
    );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-3 gap-3">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</div>
            <div className="col-span-2">{value}</div>
        </div>
    );
}

function PreWrap({ text }: { text: string }) {
    return <div className="whitespace-pre-wrap text-sm leading-6">{text}</div>;
}

function linkOrDash(url?: string | null) {
    if (!url) return "—";
    return (
        <a className="underline break-all" href={url} target="_blank" rel="noreferrer">
            {url}
        </a>
    );
}
