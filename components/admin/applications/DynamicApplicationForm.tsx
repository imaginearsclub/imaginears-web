"use client";

import { useMemo, useState } from "react";

type Role = "Developer" | "GuestServices" | "Imaginear";

export type ApplicationFormValue = {
    name: string;
    email: string;
    role: Role;
    // shared:
    availability?: string;
    portfolioUrl?: string;
    // dev-specific:
    github?: string;
    languages?: string[];
    // guest services-specific:
    customerExperienceYears?: number | "";
    hasWeekendAvailability?: "Yes" | "No" | "";
    // imaginear-specific:
    creativeDiscipline?: "Design" | "Music" | "Writing" | "Performance" | "";
    sampleWorkUrl?: string;
    // follow-ups:
    priorExperience?: "Yes" | "No" | "";
    priorExperienceDetails?: string;
};

export default function DynamicApplicationForm({
                                                   initial,
                                                   onSubmit,
                                               }: {
    initial?: Partial<ApplicationFormValue>;
    onSubmit: (values: ApplicationFormValue) => Promise<void> | void;
}) {
    const [v, setV] = useState<ApplicationFormValue>({
        name: initial?.name ?? "",
        email: initial?.email ?? "",
        role: (initial?.role ?? "Developer") as Role,
        availability: initial?.availability ?? "",
        portfolioUrl: initial?.portfolioUrl ?? "",
        github: initial?.github ?? "",
        languages: initial?.languages ?? [],
        customerExperienceYears: initial?.customerExperienceYears ?? "",
        hasWeekendAvailability: (initial?.hasWeekendAvailability ?? "") as any,
        creativeDiscipline: (initial?.creativeDiscipline ?? "") as any,
        sampleWorkUrl: initial?.sampleWorkUrl ?? "",
        priorExperience: (initial?.priorExperience ?? "") as any,
        priorExperienceDetails: initial?.priorExperienceDetails ?? "",
    });

    const LANGS = useMemo(
        () => ["TypeScript", "JavaScript", "Python", "Go", "Rust", "C#", "Java"],
        []
    );

    const DISCIPLINES: NonNullable<ApplicationFormValue["creativeDiscipline"]>[] =
        ["Design", "Music", "Writing", "Performance"];

    const roleBlock = {
        Developer: (
            <>
                <div>
                    <label className="text-sm font-medium">GitHub</label>
                    <input
                        value={v.github ?? ""}
                        onChange={(e) => setV({ ...v, github: e.target.value })}
                        placeholder="https://github.com/yourname"
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Languages</label>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {LANGS.map((lang) => {
                            const checked = v.languages?.includes(lang) ?? false;
                            return (
                                <label key={lang} className="inline-flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => {
                                            const next = new Set(v.languages);
                                            checked ? next.delete(lang) : next.add(lang);
                                            setV({ ...v, languages: Array.from(next) });
                                        }}
                                    />
                                    {lang}
                                </label>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium">Portfolio URL (optional)</label>
                    <input
                        value={v.portfolioUrl ?? ""}
                        onChange={(e) => setV({ ...v, portfolioUrl: e.target.value })}
                        placeholder="https://…"
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    />
                </div>
            </>
        ),
        GuestServices: (
            <>
                <div>
                    <label className="text-sm font-medium">Years in customer-facing roles</label>
                    <input
                        type="number"
                        min={0}
                        value={v.customerExperienceYears ?? ""}
                        onChange={(e) =>
                            setV({ ...v, customerExperienceYears: e.target.value === "" ? "" : Number(e.target.value) })
                        }
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Weekend availability?</label>
                    <select
                        value={v.hasWeekendAvailability ?? ""}
                        onChange={(e) => setV({ ...v, hasWeekendAvailability: e.target.value as any })}
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    >
                        <option value="">Choose…</option>
                        <option>Yes</option>
                        <option>No</option>
                    </select>
                </div>
            </>
        ),
        Imaginear: (
            <>
                <div>
                    <label className="text-sm font-medium">Primary discipline</label>
                    <select
                        value={v.creativeDiscipline ?? ""}
                        onChange={(e) => setV({ ...v, creativeDiscipline: e.target.value as any })}
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    >
                        <option value="">Choose…</option>
                        {DISCIPLINES.map((d) => (
                            <option key={d}>{d}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium">Sample work URL</label>
                    <input
                        value={v.sampleWorkUrl ?? ""}
                        onChange={(e) => setV({ ...v, sampleWorkUrl: e.target.value })}
                        placeholder="Portfolio, drive link, or samples"
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                    />
                </div>
            </>
        ),
    }[v.role];

    const followUps = (
        <>
            <div>
                <label className="text-sm font-medium">Prior experience with Imaginears?</label>
                <select
                    value={v.priorExperience ?? ""}
                    onChange={(e) => setV({ ...v, priorExperience: e.target.value as any })}
                    className="mt-1 w-full rounded-2xl border px-4 py-3"
                >
                    <option value="">Choose…</option>
                    <option>Yes</option>
                    <option>No</option>
                </select>
            </div>

            {v.priorExperience === "Yes" && (
                <div>
                    <label className="text-sm font-medium">Tell us more</label>
                    <textarea
                        value={v.priorExperienceDetails ?? ""}
                        onChange={(e) => setV({ ...v, priorExperienceDetails: e.target.value })}
                        rows={4}
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                        placeholder="What did you do? When? Any links?"
                    />
                </div>
            )}
        </>
    );

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        await onSubmit(v);
    }

    return (
        <form className="space-y-4" onSubmit={submit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="text-sm font-medium">Full Name *</label>
                    <input
                        value={v.name}
                        onChange={(e) => setV({ ...v, name: e.target.value })}
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                        required
                    />
                </div>
                <div>
                    <label className="text-sm font-medium">Email *</label>
                    <input
                        type="email"
                        value={v.email}
                        onChange={(e) => setV({ ...v, email: e.target.value })}
                        className="mt-1 w-full rounded-2xl border px-4 py-3"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Applying for *</label>
                <select
                    value={v.role}
                    onChange={(e) => setV({ ...v, role: e.target.value as Role })}
                    className="mt-1 w-full rounded-2xl border px-4 py-3"
                    required
                >
                    <option>Developer</option>
                    <option>GuestServices</option>
                    <option>Imaginear</option>
                </select>
            </div>

            {/* role-specific questions */}
            {roleBlock}

            <div>
                <label className="text-sm font-medium">General availability</label>
                <input
                    value={v.availability ?? ""}
                    onChange={(e) => setV({ ...v, availability: e.target.value })}
                    placeholder="e.g., Weeknights, weekends, 10-20 hrs/wk"
                    className="mt-1 w-full rounded-2xl border px-4 py-3"
                />
            </div>

            {/* Follow-up branching */}
            {followUps}

            <div className="pt-2 flex justify-end">
                <button className="btn btn-primary">Submit</button>
            </div>
        </form>
    );
}
