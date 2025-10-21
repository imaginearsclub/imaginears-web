"use client";

type Props = {
    targetId: string; // id of the textarea to format
};

function surroundSelection(el: HTMLTextAreaElement, prefix: string, suffix: string) {
    const { selectionStart, selectionEnd, value } = el;
    const selected = value.slice(selectionStart, selectionEnd);
    const next = value.slice(0, selectionStart) + prefix + selected + suffix + value.slice(selectionEnd);
    el.value = next;
    const cursor = selectionStart + prefix.length + selected.length + suffix.length;
    el.setSelectionRange(cursor, cursor);
    el.dispatchEvent(new Event("input", { bubbles: true })); // so React onChange fires
}

export default function MarkdownToolbar({ targetId }: Props) {
    const getEl = () => document.getElementById(targetId) as HTMLTextAreaElement | null;

    return (
        <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 px-2 py-1.5">
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => { const el = getEl(); if (el) surroundSelection(el, "**", "**"); }}>
                Bold
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => { const el = getEl(); if (el) surroundSelection(el, "_", "_"); }}>
                Italic
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => { const el = getEl(); if (el) surroundSelection(el, "[", "](https://)"); }}>
                Link
            </button>
            <button type="button" className="btn btn-ghost btn-xs" onClick={() => { const el = getEl(); if (el) surroundSelection(el, "- ", ""); }}>
                • List
            </button>
            <div className="ml-auto text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                Markdown supported
            </div>
        </div>
    );
}
