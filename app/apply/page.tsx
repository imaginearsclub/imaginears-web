"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, FormProvider, Controller, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import Turnstile from "react-turnstile";
import {
    StepSafeSchema,
    type StepSafeInput,
    Roles,
    DevSpecialties,
    Levels,
    schemaForRole,
    type FinalApplicationInput,
} from "@/lib/validation/application";

const LANGS = ["Java", "JavaScript", "TypeScript", "Python", "Go", "C#", "Rust"];

function getLocalTZ() {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
        return "";
    }
}

const stepAnim = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.18 } },
    exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

export default function ApplyPage() {
    const methods = useForm<StepSafeInput>({
        resolver: zodResolver(StepSafeSchema), // step-safe: no union errors mid-flow
        defaultValues: {
            name: "",
            email: "",
            mcUsername: "",
            confirm16: false,
            canDiscord: true,
            discordUser: "",
            ageRange: "Under18",
            timezone: getLocalTZ(),
            priorStaff: false,
            priorServers: "",
            visitedDisney: false,
            visitedDetails: "",
            role: "Developer",
            // developer
            devPortfolioUrl: "",
            devSpecialty: "Web",
            devLanguages: [],
            // imaginear
            imgPortfolioUrl: "",
            imgWorldEditLevel: "Beginner",
            imgPluginFamiliar: "Beginner",
            // guest relations
            grStory: "",
            grValue: "",
            grSuggestions: "",
        },
        mode: "onBlur",
    });

    const {
        handleSubmit,
        watch,
        setValue,
        formState: { isSubmitting, errors },
    } = methods;

    const role = watch("role");
    const canDiscord = watch("canDiscord");
    const confirm16 = watch("confirm16");
    const priorStaff = watch("priorStaff");
    const visitedDisney = watch("visitedDisney");

    // Honeypot (bots often fill visible-ish inputs or hidden ones)
    const honeypotRef = useRef<HTMLInputElement | null>(null);

    // Cloudflare Turnstile
    const [tsToken, setTsToken] = useState<string>("");
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

    useEffect(() => {
        if (!canDiscord) setValue("discordUser", "");
    }, [canDiscord, setValue]);

    const [step, setStep] = useState(0);
    const maxStep = 3;

    function next() {
        setStep((s) => Math.min(maxStep, s + 1));
    }
    function back() {
        setStep((s) => Math.max(0, s - 1));
    }

    async function onSubmit(data: StepSafeInput) {
        // Honeypot check
        if (honeypotRef.current && honeypotRef.current.value.trim().length > 0) {
            // quietly drop (or show generic error)
            alert("Unable to submit at this time.");
            return;
        }

        if (!confirm16) return; // UX guard; schema also enforces

        // Final strict validation by role (prevents TS2339 etc.)
        const strictSchema = schemaForRole(data.role);
        const finalData = strictSchema.parse(data) as FinalApplicationInput;

        // Require Turnstile token
        if (!tsToken) {
            alert("Please verify the Turnstile challenge.");
            return;
        }

        const res = await fetch("/api/public/applications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // include turnstile token + honeypot echo for server checks
            body: JSON.stringify({ ...finalData, __turnstileToken: tsToken, __hp: "" }),
        });

        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            alert(j.error || "Something went wrong submitting your application.");
            return;
        }

        // Optional: reset Turnstile (if you stay on page). We redirect instead:
        window.location.href = "/apply/success";
    }

    const errorList = useMemo(
        () =>
            Object.values(errors).length > 0 ? (
                <div className="mb-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 text-sm">
                    Please check the highlighted fields.
                </div>
            ) : null,
        [errors]
    );

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold">✨ Join the Imaginears Team</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
                Help us craft magical memories and dream up new adventures for guests around the world.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 sm:p-6">
                <FormProvider {...methods}>
                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        {/* Honeypot (hidden from sighted users) */}
                        <input
                            ref={honeypotRef}
                            name="company"
                            autoComplete="organization"
                            tabIndex={-1}
                            aria-hidden="true"
                            className="hidden"
                        />

                        {errorList}

                        <div className="mb-4 flex items-center justify-between">
                            <Progress step={step} maxStep={maxStep} />
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                Step {step + 1} of {maxStep + 1}
              </span>
                        </div>

                        <AnimatePresence mode="wait">
                            {step === 0 && (
                                <motion.div key="step0" {...stepAnim} className="space-y-4">
                                    <SectionTitle title="About You" subtitle="Tell us who you are." />
                                    <FieldText name="name" label="Full Name *" placeholder="Your name" />
                                    <FieldEmail name="email" label="Email *" placeholder="name@example.com" />
                                    <FieldText name="mcUsername" label="Minecraft Username *" placeholder="Your in-game name" />
                                    <FieldSelect
                                        name="ageRange"
                                        label="Age Range *"
                                        options={[
                                            { value: "Under18", label: "Under 18" },
                                            { value: "18-24", label: "18–24" },
                                            { value: "25+", label: "25+" },
                                        ]}
                                    />
                                    <FieldCheckbox name="confirm16" label="I confirm that I am at least 16 years old." />
                                    {!confirm16 && (
                                        <div className="rounded-xl bg-amber-50 text-amber-800 px-3 py-2 text-sm">
                                            Applicants must be 16 or older.
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 1 && (
                                <motion.div key="step1" {...stepAnim} className="space-y-4">
                                    <SectionTitle title="Experience" subtitle="A few quick questions." />
                                    <FieldTimezone />
                                    <FieldSwitch name="canDiscord" label="Can you use Discord?" />
                                    {canDiscord && <FieldText name="discordUser" label="Discord Username" placeholder="name#0001 or @name" />}
                                    <FieldSwitch name="priorStaff" label="Have you been staff on a Minecraft server before?" />
                                    {priorStaff && (
                                        <FieldText
                                            name="priorServers"
                                            label="Which servers or IPs?"
                                            placeholder="Example: play.example.net — Moderator (2023–2024)"
                                        />
                                    )}
                                    <FieldSwitch name="visitedDisney" label="Have you visited a Disney park or cruise?" />
                                    {visitedDisney && (
                                        <FieldText name="visitedDetails" label="Which ones?" placeholder="e.g., WDW Magic Kingdom (2022), DCL" />
                                    )}
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="step2" {...stepAnim} className="space-y-4">
                                    <SectionTitle title="Your Role" subtitle="Pick the path that fits you best." />
                                    <FieldSelect
                                        name="role"
                                        label="Which position are you applying for? *"
                                        options={Roles.map((r) => ({ value: r, label: r === "GuestServices" ? "Guest Relations" : r }))}
                                    />

                                    {role === "Developer" && (
                                        <div className="space-y-4">
                                            <FieldUrl name="devPortfolioUrl" label="Portfolio or GitHub *" placeholder="https://github.com/you" />
                                            <FieldSelect
                                                name="devSpecialty"
                                                label="Primary specialty *"
                                                options={DevSpecialties.map((s) => ({ value: s, label: s === "FullStack" ? "Full Stack" : s }))}
                                            />
                                            <Controller
                                                name="devLanguages"
                                                render={({ field }) => (
                                                    <div>
                                                        <label className="text-sm font-medium">Languages *</label>
                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                            {LANGS.map((lang) => {
                                                                const checked = field.value?.includes(lang);
                                                                return (
                                                                    <label key={lang} className="inline-flex items-center gap-2 text-sm">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={!!checked}
                                                                            onChange={() => {
                                                                                const set = new Set<string>(field.value || []);
                                                                                checked ? set.delete(lang) : set.add(lang);
                                                                                field.onChange(Array.from(set));
                                                                            }}
                                                                        />
                                                                        {lang}
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                        <FieldError name="devLanguages" />
                                                    </div>
                                                )}
                                            />
                                        </div>
                                    )}

                                    {role === "Imaginear" && (
                                        <div className="space-y-4">
                                            <FieldUrl name="imgPortfolioUrl" label="Portfolio or Showcase *" placeholder="https://yourportfolio.com" />
                                            <FieldSelect
                                                name="imgWorldEditLevel"
                                                label="WorldEdit knowledge *"
                                                options={Levels.map((l) => ({ value: l, label: l }))}
                                            />
                                            <FieldSelect
                                                name="imgPluginFamiliar"
                                                label="Familiarity with plugins *"
                                                options={Levels.map((l) => ({ value: l, label: l }))}
                                            />
                                        </div>
                                    )}

                                    {role === "GuestServices" && (
                                        <div className="space-y-4">
                                            <FieldTextarea
                                                name="grStory"
                                                label="Tell us about a time you went above and beyond to help someone *"
                                                rows={5}
                                            />
                                            <FieldTextarea
                                                name="grValue"
                                                label="What could you bring to Imaginears Club as a Guest Relations member? *"
                                                rows={4}
                                            />
                                            <FieldTextarea
                                                name="grSuggestions"
                                                label="Any suggestions to make the server better for guests?"
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="step3" {...stepAnim} className="space-y-4">
                                    <SectionTitle title="Review & Verify" subtitle="One last step before you submit." />
                                    {/* Cloudflare Turnstile */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                                        <Turnstile
                                            sitekey={siteKey}
                                            onVerify={(token) => setTsToken(token)}
                                            onExpire={() => setTsToken("")}
                                            onError={() => setTsToken("")}
                                            options={{ appearance: "interaction-only", theme: "auto" }}
                                        />
                                        {!tsToken && (
                                            <p className="mt-2 text-xs text-slate-500">
                                                Please complete the verification above.
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                type="button"
                                className="btn btn-muted"
                                onClick={back}
                                disabled={step === 0 || isSubmitting}
                            >
                                Back
                            </button>

                            {step < maxStep ? (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={async () => {
                                        const ok = await validateStep(methods, step);
                                        if (ok) next();
                                    }}
                                >
                                    Continue
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className={`btn btn-primary ${isSubmitting ? "is-loading" : ""}`}
                                    disabled={isSubmitting || !tsToken}
                                >
                                    Submit Application
                                </button>
                            )}
                        </div>
                    </form>
                </FormProvider>
            </div>
        </div>
    );
}

/* ---------- UI helpers ---------- */

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
    return (
        <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
        </div>
    );
}

function FieldError({ name }: { name: keyof StepSafeInput | string }) {
    const {
        formState: { errors },
    } = useFormContext<StepSafeInput>();
    const err = name.split(".").reduce<any>((a, k) => (a ? a[k] : undefined), errors as any);
    if (!err?.message) return null;
    return <p className="mt-1 text-xs text-rose-600">{String(err.message)}</p>;
}

function FieldText(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div>
            <label className="text-sm font-medium">{props.label}</label>
            <input
                {...register(props.name)}
                placeholder={props.placeholder}
                className="mt-1 w-full rounded-2xl border px-4 py-3"
            />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldEmail(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div>
            <label className="text-sm font-medium">{props.label}</label>
            <input type="email" {...register(props.name)} placeholder={props.placeholder} className="mt-1 w-full rounded-2xl border px-4 py-3" />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldUrl(props: { name: keyof StepSafeInput; label: string; placeholder?: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div>
            <label className="text-sm font-medium">{props.label}</label>
            <input type="url" {...register(props.name)} placeholder={props.placeholder} className="mt-1 w-full rounded-2xl border px-4 py-3" />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldTextarea(props: { name: keyof StepSafeInput; label: string; rows?: number }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div>
            <label className="text-sm font-medium">{props.label}</label>
            <textarea {...register(props.name)} rows={props.rows ?? 4} className="mt-1 w-full rounded-2xl border px-4 py-3" />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldSelect(props: {
    name: keyof StepSafeInput;
    label: string;
    options: { value: string; label: string }[];
}) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div>
            <label className="text-sm font-medium">{props.label}</label>
            <select {...register(props.name)} className="mt-1 w-full rounded-2xl border px-4 py-3">
                {props.options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <FieldError name={props.name} />
        </div>
    );
}

function FieldCheckbox(props: { name: keyof StepSafeInput; label: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" {...register(props.name)} />
            {props.label}
            <FieldError name={props.name} />
        </label>
    );
}

function FieldSwitch(props: { name: keyof StepSafeInput; label: string }) {
    const { register } = useFormContext<StepSafeInput>();
    return (
        <div className="flex items-center gap-3">
            <label className="text-sm font-medium">{props.label}</label>
            <input type="checkbox" className="h-5 w-5" {...register(props.name)} />
            <FieldError name={props.name} />
        </div>
    );
}

function FieldTimezone() {
    const { register } = useFormContext<StepSafeInput>();
    const options =
        (Intl as any).supportedValuesOf?.("timeZone")?.map((tz: string) => ({ value: tz, label: tz })) ??
        [{ value: "America/New_York", label: "America/New_York" }];
    return (
        <div>
            <label className="text-sm font-medium">Time Zone *</label>
            <select {...register("timezone")} className="mt-1 w-full rounded-2xl border px-4 py-3">
                {options.map((o: any) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <FieldError name="timezone" />
        </div>
    );
}

/* Validate only fields for the current step */
async function validateStep(methods: any, step: number) {
    const { trigger, getValues } = methods as { trigger: (names?: string | string[]) => Promise<boolean>; getValues: () => StepSafeInput };

    if (step === 0) {
        return await trigger(["name", "email", "mcUsername", "confirm16", "ageRange"]);
    }
    if (step === 1) {
        return await trigger(["timezone", "canDiscord", "discordUser", "priorStaff", "priorServers", "visitedDisney", "visitedDetails"]);
    }
    if (step === 2) {
        const okRole = await trigger("role");
        if (!okRole) return false;
        const v = getValues();
        if (v.role === "Developer") {
            return await trigger(["devPortfolioUrl", "devSpecialty", "devLanguages"]);
        }
        if (v.role === "Imaginear") {
            return await trigger(["imgPortfolioUrl", "imgWorldEditLevel", "imgPluginFamiliar"]);
        }
        if (v.role === "GuestServices") {
            return await trigger(["grStory", "grValue", "grSuggestions"]);
        }
    }
    return true;
}

function Progress({ step, maxStep }: { step: number; maxStep: number }) {
    const pct = Math.round(((step + 1) / (maxStep + 1)) * 100);
    return (
        <div className="w-full mr-4">
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-indigo-500 to-sky-500" style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
