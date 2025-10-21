"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeRehypePlugins } from "@/lib/markdown";

type Props = {
    value: string;
    onChange: (v: string) => void;
    label?: string;
    rows?: number;
    placeholder?: string;
};

export default function MarkdownEditor({ value, onChange, label = "Details (Markdown)", rows = 10, placeholder }: Props) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const [preview, setPreview] = useState(false);

    // insert/wrap helpers
    function wrap(before: string, after: string = before, placeholderText = "") {
        const el = taRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = value.slice(start, end) || placeholderText;
        const next = value.slice(0, start) + before + sel + after + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            const pos = start + before.length + sel.length + (after ? after.length : 0);
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }

    function prefixLines(prefix: string, placeholderText = "") {
        const el = taRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = value.slice(start, end) || placeholderText;
        const block = sel
            .split("\n")
            .map((l) => (l.trim().length ? `${prefix}${l}` : l))
            .join("\n");
        const next = value.slice(0, start) + block + value.slice(end);
        onChange(next);
        requestAnimationFrame(() => {
            const pos = start + block.length;
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                <div className="flex items-center gap-2">
                    <ToolbarButton title="Bold" onClick={() => wrap("**", "**", "bold text")}>B</ToolbarButton>
                    <ToolbarButton title="Italic" onClick={() => wrap("*", "*", "italic text")}><em>I</em></ToolbarButton>
                    <ToolbarButton title="Code" onClick={() => wrap("`", "`", "code")}>{`</>`}</ToolbarButton>
                    <ToolbarButton title="Link" onClick={() => wrap("[", "](https://)", "text")}>🔗</ToolbarButton>
                    <ToolbarButton title="H2" onClick={() => prefixLines("## ")}>H2</ToolbarButton>
                    <ToolbarButton title="H3" onClick={() => prefixLines("### ")}>H3</ToolbarButton>
                    <ToolbarButton title="Quote" onClick={() => prefixLines("> ", "Quote")}>❝</ToolbarButton>
                    <ToolbarButton title="Bulleted list" onClick={() => prefixLines("- ", "List item")}>• List</ToolbarButton>
                    <ToolbarButton title="Numbered list" onClick={() => prefixLines("1. ", "Step")}>1.</ToolbarButton>

                    <button
                        type="button"
                        className={`text-xs px-2 py-1 rounded border ${preview ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-white dark:bg-slate-900"}`}
                        onClick={() => setPreview((p) => !p)}
                        aria-pressed={preview}
                    >
                        {preview ? "Edit" : "Preview"}
                    </button>
                </div>
            </div>

            {!preview ? (
                <textarea
                    ref={taRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={rows}
                    placeholder={placeholder || "Write Markdown…"}
                    className="mt-1 w-full rounded-2xl border px-4 py-3 font-mono text-sm"
                />
            ) : (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 p-4 prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={safeRehypePlugins as any}>{value || "_Nothing to preview yet._"}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

function ToolbarButton({
                           title,
                           onClick,
                           children,
                       }: {
    title: string;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="text-xs rounded border px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
            {children}
        </button>
    );
}
