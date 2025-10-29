import { Card, CardHeader, CardTitle, CardDescription, CardContent, Alert, CommandPalette, type CommandItem } from "@/components/common";
import { cn } from "@/lib/utils";

interface CommandPaletteCardProps {
  commandItems: CommandItem[];
}

export function CommandPaletteCard({ commandItems }: CommandPaletteCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Command Palette</CardTitle>
        <CardDescription>Keyboard-driven command menu (⌘K / Ctrl+K)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className={cn("text-sm text-slate-600 dark:text-slate-400")}>
          Press <kbd className={cn("px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700", "text-slate-600 dark:text-slate-400")}>⌘K</kbd> or click the button below to open the command palette.
        </p>
        <CommandPalette items={commandItems} />
        <Alert variant="info">
          <strong>Pro tip:</strong> Use the keyboard shortcut ⌘K (Mac) or Ctrl+K (Windows) to quickly access navigation and actions.
        </Alert>
      </CardContent>
    </Card>
  );
}

