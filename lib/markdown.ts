import type { Options as RehypeSanitizeOptions } from "rehype-sanitize";
import { defaultSchema } from "hast-util-sanitize";

// Allow a few extra tags/attrs beyond the default (no raw <script> ever)
export const markdownSanitizeSchema: RehypeSanitizeOptions = {
    ...defaultSchema,
    attributes: {
        ...defaultSchema.attributes,
        a: [
            ...(defaultSchema.attributes?.a || []),
            ["target", "_blank"],
            ["rel", "noopener noreferrer"],
        ],
        // allow className on code/pre for future syntax themes if you add one
        code: [
            ...(defaultSchema.attributes?.code || []),
            ["className"],
        ],
        pre: [
            ...(defaultSchema.attributes?.pre || []),
            ["className"],
        ],
    },
};
