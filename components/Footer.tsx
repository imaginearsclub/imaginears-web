export default function Footer() {
  // Compute once per render on the server. Use UTC to avoid TZ edge cases.
  const year = new Date().getUTCFullYear();

  return (
    <footer
      aria-labelledby="site-footer-heading"
      className="mt-16 relative isolate bg-white border-t border-slate-200/60 dark:border-slate-800 dark:bg-gradient-to-tr dark:from-slate-900 dark:via-slate-950 dark:to-slate-900"
      role="contentinfo"
    >
      {/* Visually hidden heading for landmark semantics */}
      <h2 id="site-footer-heading" className="sr-only">Site footer</h2>

      <div className="container py-10 text-sm text-body flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p>
            © <time dateTime={`${year}`}>{year}</time> Imaginears Club • Not affiliated with The Walt Disney Company.
          </p>
          <p className="mt-1">
            Minecraft server: <code className="font-medium text-slate-900 dark:text-slate-200">imaginears.club</code>
          </p>
        </div>
        <div className="text-xs sm:text-sm text-body dark:text-slate-500">
          <p aria-live="polite">Made with ✨ and imagination</p>
        </div>
      </div>
    </footer>
  );
}
