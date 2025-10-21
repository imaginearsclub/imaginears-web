export default function Footer() {
    return (
        <footer
            className="
        mt-16 border-t border-slate-200/60 dark:border-slate-800/60
        bg-gradient-to-tr from-brandStart/15 via-white/85 to-brandEnd/15
        dark:from-slate-900 dark:via-slate-950 dark:to-slate-900
      "
        >
            <div className="container py-10 text-sm text-slate-700 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <p>© {new Date().getFullYear()} Imaginears Club • Not affiliated with The Walt Disney Company.</p>
                    <p className="mt-1">
                        Minecraft server: <span className="font-medium text-slate-900 dark:text-slate-200">imaginears.club</span>
                    </p>
                </div>
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-500">
                    <p>Made with ✨ and imagination</p>
                </div>
            </div>
        </footer>
    );
}
