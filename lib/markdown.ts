import rehypeSanitize, { type Options as RehypeSanitizeOptions } from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";

// Hardened sanitize schema for Markdown rendering.
// - Disallows raw script/unsafe nodes (default)
// - Restricts URL protocols to safe schemes
// - Forces safe link targets/rel in renderers, but also allows attributes here
// - Allows className only on code/pre for styling
export const markdownSanitizeSchema: RehypeSanitizeOptions = Object.freeze({
    ...defaultSchema,
    allowComments: false,
    clobberPrefix: "user-content",
    attributes: {
        ...defaultSchema.attributes,
        a: [
            ...(defaultSchema.attributes?.a || []),
            ["target", "_blank"],
            ["rel", "noopener noreferrer nofollow"],
        ],
        img: [
            ...(defaultSchema.attributes?.img || []),
            ["loading", "lazy"],
            ["decoding", "async"],
        ],
        code: [
            ...(defaultSchema.attributes?.code || []),
            ["className"],
        ],
        pre: [
            ...(defaultSchema.attributes?.pre || []),
            ["className"],
        ],
    },
    protocols: {
        ...defaultSchema.protocols,
        href: ["http", "https", "mailto", "tel"],
        src: ["http", "https", "data"], // data URLs allowed for images only; other nodes remain filtered by schema
    },
} satisfies RehypeSanitizeOptions);

// Pre-built rehype plugins list for ReactMarkdown to reuse without reallocations per render
export const safeRehypePlugins = [
    [rehypeSanitize, markdownSanitizeSchema],
] as const;
