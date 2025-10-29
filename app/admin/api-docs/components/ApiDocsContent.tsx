"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/common";
import { API_ENDPOINTS, type ApiEndpoint } from "@/lib/api-docs";
import { ApiDocsSidebar } from "./ApiDocsSidebar";
import { ApiPlayground } from "./ApiPlayground";
import { cn } from "@/lib/utils";

export function ApiDocsContent() {
  const [selectedCategory, setSelectedCategory] = useState("events");
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(
    API_ENDPOINTS.find(e => e.category === "events") || null
  );

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const firstEndpoint = API_ENDPOINTS.find(e => e.category === category);
    setSelectedEndpoint(firstEndpoint || null);
  };

  if (!selectedEndpoint) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-3">
        <ApiDocsSidebar
          selectedCategory={selectedCategory}
          selectedEndpoint={selectedEndpoint}
          onCategoryChange={handleCategoryChange}
          onEndpointChange={setSelectedEndpoint}
        />
      </div>

      <div className="lg:col-span-9 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start gap-4">
              <span className={cn(
                "text-sm font-mono font-bold px-3 py-1 rounded shrink-0",
                selectedEndpoint.method === "GET" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                selectedEndpoint.method === "POST" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                selectedEndpoint.method === "PATCH" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                selectedEndpoint.method === "DELETE" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {selectedEndpoint.method}
              </span>
              <div className="flex-1">
                <CardTitle className="text-xl mb-2">{selectedEndpoint.title}</CardTitle>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {selectedEndpoint.description}
                </p>
                <code className="text-sm font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded block">
                  {selectedEndpoint.path}
                </code>
              </div>
            </div>
          </CardHeader>
        </Card>

        <ApiPlayground endpoint={selectedEndpoint} />
      </div>
    </div>
  );
}

