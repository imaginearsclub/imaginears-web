import rehypeSanitize, { type Options as RehypeSanitizeOptions } from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";

// Hardened sanitize schema for Markdown rendering.
// Security:
// - Disallows raw script/unsafe nodes (default)
// - Disallows HTML comments and doctypes
// - Restricts URL protocols to safe schemes (no javascript:, data: limited)
// - Forces safe link targets/rel (noopener prevents tabnabbing)
// - Prefixes user IDs to prevent DOM clobbering attacks
// Performance:
// - Enables native lazy loading for images
// - Enables async image decoding to prevent blocking
// - Allows className only on code/pre for syntax highlighting
export const markdownSanitizeSchema: RehypeSanitizeOptions = Object.freeze({
    ...defaultSchema,
    allowComments: false,
    allowDoctypes: false,
    clobberPrefix: "user-content-",
    attributes: {
        ...defaultSchema.attributes,
        a: [
            ...(defaultSchema.attributes?.["a"] || []),
            ["target", "_blank"],
            ["rel", "noopener noreferrer nofollow"],
        ],
        img: [
            ...(defaultSchema.attributes?.["img"] || []),
            ["loading", "lazy"],
            ["decoding", "async"],
            ["alt"], // Ensure alt text is preserved for accessibility
        ],
        code: [
            ...(defaultSchema.attributes?.["code"] || []),
            // Only allow language-* className pattern for syntax highlighting
            ["className", /^language-./],
        ],
        pre: [
            ...(defaultSchema.attributes?.["pre"] || []),
            ["className", /^language-./],
        ],
    },
    protocols: {
        ...defaultSchema.protocols,
        href: ["http", "https", "mailto", "tel"],
        // Removed data: URLs for security - use external image hosting instead
        // If data URLs are needed, consider validating MIME types explicitly
        src: ["http", "https"],
    },
} satisfies RehypeSanitizeOptions);

// Pre-built rehype plugins list for ReactMarkdown to reuse without reallocations per render
export const safeRehypePlugins = [
    [rehypeSanitize, markdownSanitizeSchema],
] as const;
