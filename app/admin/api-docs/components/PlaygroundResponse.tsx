"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { cn } from "@/lib/utils";

interface PlaygroundResponseProps {
  response: {
    status?: number;
    statusText?: string;
    data?: unknown;
    error?: string;
  };
}

export function PlaygroundResponse({ response }: PlaygroundResponseProps) {
  return (
    <Card className={cn(
      "border-l-4",
      response.status && response.status >= 200 && response.status < 300
        ? "border-l-green-500"
        : "border-l-red-500"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Response</CardTitle>
          {response.status && (
            <span className={cn(
              "text-sm font-mono px-2 py-1 rounded",
              response.status >= 200 && response.status < 300
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            )}>
              {response.status} {response.statusText}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg overflow-x-auto text-sm">
          <code>{JSON.stringify(response.data || response, null, 2)}</code>
        </pre>
      </CardContent>
    </Card>
  );
}

