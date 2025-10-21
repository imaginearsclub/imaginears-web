// Central schema used by both public form and admin UI.

export type FieldType =
    | "shortText"
    | "longText"
    | "url"
    | "select"
    | "multiSelect"
    | "timezone";

export type Field = {
    id: string;                 // key used in answers object
    label: string;              // human label
    type: FieldType;
    required?: boolean;
    placeholder?: string;
    help?: string;
    options?: { value: string; label: string }[]; // for select / multiSelect
};

export type ApplicationSchema = {
    version: string;
    title: string;
    fields: Field[];
};

// v1: mirrors what we have + room to grow
export const APPLICATION_SCHEMA_V1: ApplicationSchema = {
    version: "1",
    title: "Imaginears Club Application",
    fields: [
        {
            id: "role",
            label: "Desired Role",
            type: "select",
            required: true,
            options: [
                { value: "Developer", label: "Developer" },
                { value: "Guest Services", label: "Guest Services" },
                { value: "Imaginear", label: "Imaginear" },
            ],
            help: "Pick the role that best matches your interests.",
        },
        {
            id: "why",
            label: "Why do you want to join?",
            type: "longText",
            required: true,
            placeholder:
                "Tell us about your experience, what excites you, and what you'd like to do.",
        },
        {
            id: "portfolio",
            label: "Portfolio or examples (URL)",
            type: "url",
            placeholder: "https://example.com/you",
            help: "GitHub, ArtStation, personal site, etc.",
        },
        {
            id: "timezone",
            label: "Your Timezone",
            type: "timezone",
            required: true,
            help: "Used for scheduling interviews or onboarding.",
        },
        // Add more fields over time — admin + CSV will adjust automatically.
    ],
};
