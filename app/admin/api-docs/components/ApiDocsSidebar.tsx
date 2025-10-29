"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { API_ENDPOINTS, API_CATEGORIES, type ApiEndpoint } from "@/lib/api-docs";
import { Calendar, FileText, Users, Key, Server, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  events: Calendar,
  applications: FileText,
  sessions: Activity,
  users: Users,
  "api-keys": Key,
  server: Server,
  auth: Shield,
};

interface ApiDocsSidebarProps {
  selectedCategory: string;
  selectedEndpoint: ApiEndpoint | null;
  onCategoryChange: (category: string) => void;
  onEndpointChange: (endpoint: ApiEndpoint) => void;
}

export function ApiDocsSidebar({
  selectedCategory,
  selectedEndpoint,
  onCategoryChange,
  onEndpointChange,
}: ApiDocsSidebarProps) {
  const categoryEndpoints = API_ENDPOINTS.filter(e => e.category === selectedCategory);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">API Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {API_CATEGORIES.map((category) => {
            const Icon = CATEGORY_ICONS[category.id as keyof typeof CATEGORY_ICONS];
            const count = API_ENDPOINTS.filter(e => e.category === category.id).length;
            
            return (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedCategory === category.id
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span className="flex-1 text-left">{category.name}</span>
                <span className="text-xs text-slate-500">{count}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {categoryEndpoints.map((endpoint) => (
            <button
              key={endpoint.id}
              onClick={() => onEndpointChange(endpoint)}
              className={cn(
                "w-full flex items-start gap-2 px-3 py-2 rounded-lg text-left transition-colors",
                selectedEndpoint?.id === endpoint.id
                  ? "bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <span className={cn(
                "text-xs font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                endpoint.method === "GET" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                endpoint.method === "POST" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                endpoint.method === "PATCH" && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                endpoint.method === "DELETE" && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              )}>
                {endpoint.method}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 dark:text-white">
                  {endpoint.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                  {endpoint.path}
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

