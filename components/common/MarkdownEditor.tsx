"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeRehypePlugins } from "@/lib/markdown";

type Props = {
    value: string;
    onChange: (v: string) => void;
    label?: string;
    rows?: number;
    placeholder?: string;
    maxLength?: number;
};

export default function MarkdownEditor({ 
    value, 
    onChange, 
    label = "Details (Markdown)", 
    rows = 10, 
    placeholder,
    maxLength = 10000 
}: Props) {
    const taRef = useRef<HTMLTextAreaElement | null>(null);
    const [preview, setPreview] = useState(false);

    // Sanitize input to prevent potential issues
    const sanitizedValue = useMemo(() => {
        if (typeof value !== 'string') return '';
        return value.slice(0, maxLength);
    }, [value, maxLength]);

    // Memoized insert/wrap helpers for performance
    const wrap = useCallback((before: string, after: string = before, placeholderText = "") => {
        const el = taRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = sanitizedValue.slice(start, end) || placeholderText;
        const next = sanitizedValue.slice(0, start) + before + sel + after + sanitizedValue.slice(end);
        
        // Check max length
        if (next.length > maxLength) return;
        
        onChange(next);
        requestAnimationFrame(() => {
            const pos = start + before.length + sel.length + (after ? after.length : 0);
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }, [sanitizedValue, onChange, maxLength]);

    const prefixLines = useCallback((prefix: string, placeholderText = "") => {
        const el = taRef.current;
        if (!el) return;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const sel = sanitizedValue.slice(start, end) || placeholderText;
        const block = sel
            .split("\n")
            .map((l) => (l.trim().length ? `${prefix}${l}` : l))
            .join("\n");
        const next = sanitizedValue.slice(0, start) + block + sanitizedValue.slice(end);
        
        // Check max length
        if (next.length > maxLength) return;
        
        onChange(next);
        requestAnimationFrame(() => {
            const pos = start + block.length;
            el.focus();
            el.setSelectionRange(pos, pos);
        });
    }, [sanitizedValue, onChange, maxLength]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!taRef.current || preview) return;
            
            if ((e.ctrlKey || e.metaKey)) {
                switch (e.key) {
                    case 'b':
                        e.preventDefault();
                        wrap("**", "**", "bold text");
                        break;
                    case 'i':
                        e.preventDefault();
                        wrap("*", "*", "italic text");
                        break;
                    case 'k':
                        e.preventDefault();
                        wrap("[", "](https://)", "text");
                        break;
                }
            }
        };

        const textarea = taRef.current;
        textarea?.addEventListener('keydown', handleKeyDown);
        return () => textarea?.removeEventListener('keydown', handleKeyDown);
    }, [wrap, preview]);

    const charCount = sanitizedValue.length;
    const isNearLimit = charCount > maxLength * 0.9;

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-semibold text-body dark:text-white">
                    {label}
                </label>
                <div className="flex items-center gap-1.5">
                    <ToolbarButton 
                        title="Bold (Ctrl+B)" 
                        onClick={() => wrap("**", "**", "bold text")}
                        icon={<BoldIcon />}
                    />
                    <ToolbarButton 
                        title="Italic (Ctrl+I)" 
                        onClick={() => wrap("*", "*", "italic text")}
                        icon={<ItalicIcon />}
                    />
                    <ToolbarButton 
                        title="Code" 
                        onClick={() => wrap("`", "`", "code")}
                        icon={<CodeIcon />}
                    />
                    <ToolbarButton 
                        title="Link (Ctrl+K)" 
                        onClick={() => wrap("[", "](https://)", "text")}
                        icon={<LinkIcon />}
                    />
                    <div className="w-px h-5 bg-white/50 text-body dark:bg-slate-700 mx-0.5" />
                    <ToolbarButton 
                        title="Heading 2" 
                        onClick={() => prefixLines("## ")}
                        text="H2"
                    />
                    <ToolbarButton 
                        title="Heading 3" 
                        onClick={() => prefixLines("### ")}
                        text="H3"
                    />
                    <ToolbarButton 
                        title="Quote" 
                        onClick={() => prefixLines("> ", "Quote")}
                        icon={<QuoteIcon />}
                    />
                    <ToolbarButton 
                        title="Bullet List" 
                        onClick={() => prefixLines("- ", "List item")}
                        icon={<ListIcon />}
                    />
                    <ToolbarButton 
                        title="Numbered List" 
                        onClick={() => prefixLines("1. ", "Step")}
                        icon={<NumberListIcon />}
                    />
                    <div className="w-px h-5 bg-white/50 text-body dark:bg-slate-700 mx-0.5" />
                    <button
                        type="button"
                        className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                            preview 
                                ? "bg-slate-800 text-white border-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-300 shadow-sm" 
                                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                        onClick={() => setPreview((p) => !p)}
                        aria-pressed={preview}
                        aria-label={preview ? "Switch to edit mode" : "Switch to preview mode"}
                    >
                        {preview ? (
                            <span className="flex items-center gap-1.5">
                                <EditIcon />
                                Edit
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5">
                                <EyeIcon />
                                Preview
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {!preview ? (
                <div className="relative">
                    <textarea
                        ref={taRef}
                        value={sanitizedValue}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= maxLength) {
                                onChange(newValue);
                            }
                        }}
                        rows={rows}
                        placeholder={placeholder || "Write Markdown…"}
                        maxLength={maxLength}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 font-mono text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-y"
                        aria-label={label}
                    />
                    <div className={`absolute bottom-3 right-3 text-xs ${
                        isNearLimit ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400 dark:text-slate-500'
                    }`}>
                        {charCount} / {maxLength}
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-6 prose dark:prose-invert max-w-none min-h-[200px]">
                    <ReactMarkdown 
                        remarkPlugins={[remarkGfm]} 
                        rehypePlugins={safeRehypePlugins as any}
                    >
                        {sanitizedValue || "_Nothing to preview yet._"}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
}

function ToolbarButton({
    title,
    onClick,
    icon,
    text,
}: {
    title: string;
    onClick: () => void;
    icon?: React.ReactNode;
    text?: string;
}) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="text-xs rounded-md border text-body dark:text-white border-slate-300 dark:border-slate-700 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors bg-white dark:bg-slate-900 active:scale-95 transform"
            aria-label={title}
        >
            {icon || <span className="font-semibold">{text}</span>}
        </button>
    );
}

// Icon components
function BoldIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
        </svg>
    );
}

function ItalicIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m0 0l4 0m-4 0l-4 0" />
        </svg>
    );
}

function CodeIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    );
}

function LinkIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

function QuoteIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
    );
}

function ListIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
    );
}

function NumberListIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5h10M9 12h10M9 19h10M3 5v4m0 0v4m0-4h.01M3 19v-4m0 4h.01" />
        </svg>
    );
}

function EyeIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );
}

function EditIcon() {
    return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
    );
}
