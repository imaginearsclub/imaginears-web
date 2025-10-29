import { Card, CardHeader, CardTitle, CardDescription, CardContent, ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuLabel } from "@/components/common";
import { cn } from "@/lib/utils";
import { Edit, Copy, Download, Trash2 } from "lucide-react";

export function ContextMenuCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Context Menu</CardTitle>
        <CardDescription>Right-click menu with contextual actions</CardDescription>
      </CardHeader>
      <CardContent>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className={cn("flex items-center justify-center w-full h-48 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 cursor-pointer hover:border-slate-400 dark:hover:border-slate-600 transition-colors")}>
              <div className={cn("text-center space-y-2", "text-slate-900 dark:text-slate-100")}>
                <p className={cn("text-sm font-medium", "text-slate-900 dark:text-slate-100")}>Right-click here</p>
                <p className={cn("text-xs text-slate-500 dark:text-slate-400")}>Try right-clicking to see the context menu</p>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64">
            <ContextMenuLabel>Actions</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </ContextMenuItem>
            <ContextMenuItem>
              <Download className="w-4 h-4 mr-2" />
              Download
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem className="text-rose-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </CardContent>
    </Card>
  );
}

