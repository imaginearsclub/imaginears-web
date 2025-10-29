"use client";

import { useState } from "react";
import { type ApiEndpoint } from "@/lib/api-docs";
import { toast } from "sonner";

interface UseApiPlaygroundActionsProps {
  endpoint: ApiEndpoint;
  parameters: Record<string, string>;
  requestBody: string;
  apiKey: string;
  // eslint-disable-next-line no-unused-vars
  onResponse: (response: {
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: unknown;
    error?: string;
    }) => void;
}

export function useApiPlaygroundActions({
  endpoint,
  parameters,
  requestBody,
  apiKey,
  onResponse,
}: UseApiPlaygroundActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const buildUrl = () => {
    let url = endpoint.path;
    const queryParams: string[] = [];
    
    endpoint.parameters?.forEach(param => {
      const value = parameters[param.name];
      if (param.in === "path" && value) {
        url = url.replace(`{${param.name}}`, value);
      } else if (param.in === "query" && value) {
        queryParams.push(`${param.name}=${encodeURIComponent(value)}`);
      }
    });
    
    return queryParams.length > 0 ? `${url}?${queryParams.join("&")}` : url;
  };

  const buildCurl = () => {
    const path = buildUrl();
    const url = path.startsWith('/api') ? path : `/api${path}`;
    let curl = `curl -X ${endpoint.method} "https://imaginears.club${url}"`;
    
    if (endpoint.authentication === "api-key") {
      curl += ` \\\n  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`;
    }
    
    if (requestBody && ["POST", "PATCH", "PUT"].includes(endpoint.method)) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody}'`;
    }
    
    return curl;
  };

  const handleTryIt = async () => {
    setIsLoading(true);
    onResponse({});
    
    try {
      const path = buildUrl();
      const url = path.startsWith('/api') ? path : `/api${path}`;
      
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (apiKey && endpoint.authentication === "api-key") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      
      const options: RequestInit = {
        method: endpoint.method,
        headers,
        credentials: "same-origin",
      };
      
      if (requestBody && ["POST", "PATCH", "PUT"].includes(endpoint.method)) {
        try {
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch {
          toast.error("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }
      
      const fetchResponse = await fetch(url, options);
      const contentType = fetchResponse.headers.get("content-type");
      const data = contentType?.includes("application/json")
        ? await fetchResponse.json()
        : await fetchResponse.text();
      
      onResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        data,
      });
      
      toast[fetchResponse.ok ? "success" : "error"](
        fetchResponse.ok ? "Request successful!" : `Request failed: ${fetchResponse.status}`
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Request failed: ${errorMessage}`);
      onResponse({ error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, handleTryIt, buildCurl };
}

