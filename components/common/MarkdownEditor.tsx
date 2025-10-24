"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { safeRehypePlugins } from "@/lib/markdown";
import { Tooltip, Separator, Badge } from "@/components/common";
import { Bold, Italic, Code, Link, Eye, Edit, Quote, List, ListOrdered, Heading2, Heading3 } from "lucide-react";
import { cn } from "@/lib/utils";

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
                <label className="text-sm font-semibold text-slate-900 dark:text-white">
                    {label}
                </label>
                <div className="flex items-center gap-1.5">
                    <ToolbarButton 
                        title="Bold (Ctrl+B)" 
                        onClick={() => wrap("**", "**", "bold text")}
                        icon={<Bold className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Italic (Ctrl+I)" 
                        onClick={() => wrap("*", "*", "italic text")}
                        icon={<Italic className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Code" 
                        onClick={() => wrap("`", "`", "code")}
                        icon={<Code className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Link (Ctrl+K)" 
                        onClick={() => wrap("[", "](https://)", "text")}
                        icon={<Link className="w-3.5 h-3.5" />}
                    />
                    
                    <Separator orientation="vertical" className="h-5 mx-0.5" />
                    
                    <ToolbarButton 
                        title="Heading 2" 
                        onClick={() => prefixLines("## ")}
                        icon={<Heading2 className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Heading 3" 
                        onClick={() => prefixLines("### ")}
                        icon={<Heading3 className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Quote" 
                        onClick={() => prefixLines("> ", "Quote")}
                        icon={<Quote className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Bullet List" 
                        onClick={() => prefixLines("- ", "List item")}
                        icon={<List className="w-3.5 h-3.5" />}
                    />
                    <ToolbarButton 
                        title="Numbered List" 
                        onClick={() => prefixLines("1. ", "Step")}
                        icon={<ListOrdered className="w-3.5 h-3.5" />}
                    />
                    
                    <Separator orientation="vertical" className="h-5 mx-0.5" />
                    
                    <button
                        type="button"
                        className={cn(
                            "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border-2 font-medium transition-all",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                            preview 
                                ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:border-blue-500 dark:hover:bg-blue-600 shadow-sm" 
                                : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        )}
                        onClick={() => setPreview((p) => !p)}
                        aria-pressed={preview}
                        aria-label={preview ? "Switch to edit mode" : "Switch to preview mode"}
                    >
                        {preview ? (
                            <>
                                <Edit className="w-3.5 h-3.5" />
                                Edit
                            </>
                        ) : (
                            <>
                                <Eye className="w-3.5 h-3.5" />
                                Preview
                            </>
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
                        className={cn(
                            "w-full rounded-xl border-2 px-4 py-3 font-mono text-sm resize-y",
                            "bg-white dark:bg-slate-900",
                            "border-slate-300 dark:border-slate-700",
                            "text-slate-900 dark:text-slate-100",
                            "placeholder:text-slate-400 dark:placeholder:text-slate-500",
                            "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent",
                            "transition-all"
                        )}
                        aria-label={label}
                    />
                    <Badge 
                        variant={isNearLimit ? "warning" : "default"} 
                        size="sm" 
                        className="absolute bottom-3 right-3"
                    >
                        {charCount} / {maxLength}
                    </Badge>
                </div>
            ) : (
                <div className={cn(
                    "rounded-xl border-2 p-6 prose dark:prose-invert max-w-none min-h-[200px]",
                    "border-slate-300 dark:border-slate-700",
                    "bg-slate-50 dark:bg-slate-900/50"
                )}>
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
}: {
    title: string;
    onClick: () => void;
    icon: React.ReactNode;
}) {
    return (
        <Tooltip content={title} side="bottom">
            <button
                type="button"
                onClick={onClick}
                className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-lg border-2 transition-all",
                    "bg-white dark:bg-slate-900",
                    "border-slate-300 dark:border-slate-700",
                    "text-slate-700 dark:text-slate-300",
                    "hover:bg-slate-100 dark:hover:bg-slate-800",
                    "hover:border-slate-400 dark:hover:border-slate-600",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    "active:scale-95"
                )}
                aria-label={title}
            >
                {icon}
            </button>
        </Tooltip>
    );
}
