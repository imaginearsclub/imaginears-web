export default function EventsFilterBar({
  q, setQ,
  world, setWorld,
  status, setStatus,
  reset,
}: {
  q: string; setQ: (v: string) => void;
  world: "All" | "Magic Kingdom" | "EPCOT" | "Tomorrowland" | "Fantasyland" | "Main Street"; setWorld: (v: any) => void;
  status: "All" | "Draft" | "Scheduled" | "Published" | "Archived"; setStatus: (v: any) => void;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <input
        type="search"
        placeholder="Search title, world, or ID…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full sm:max-w-xs rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
      />

      <select
        value={world}
        onChange={(e) => setWorld(e.target.value)}
        className="rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
      >
        <option>All</option>
        <option>Magic Kingdom</option>
        <option>EPCOT</option>
        <option>Tomorrowland</option>
        <option>Fantasyland</option>
        <option>Main Street</option>
      </select>

      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="rounded-2xl border border-slate-300 dark:border-slate-700
                   bg-white dark:bg-slate-900 px-4 py-3 outline-none
                   focus:ring-2 focus:ring-brandStart/50"
      >
        <option>All</option>
        <option>Draft</option>
        <option>Scheduled</option>
        <option>Published</option>
        <option>Archived</option>
      </select>

      <div className="sm:ml-auto">
        <button type="button" onClick={reset} className="btn-gradient px-4 py-3">
          Reset
        </button>
      </div>
    </div>
  );
}
