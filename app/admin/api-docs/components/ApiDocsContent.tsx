"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/common";
import { 
  API_ENDPOINTS, 
  API_CATEGORIES, 
  type ApiEndpoint
} from "@/lib/api-docs";
import { 
  Play, 
  Copy, 
  Check, 
  Code, 
  Calendar,
  FileText,
  Users,
  Key,
  Server,
  Shield,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORY_ICONS = {
  events: Calendar,
  applications: FileText,
  sessions: Activity,
  users: Users,
  "api-keys": Key,
  server: Server,
  auth: Shield,
};

export function ApiDocsContent() {
  const [selectedCategory, setSelectedCategory] = useState("events");
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(
    API_ENDPOINTS.find(e => e.category === "events") || null
  );
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categoryEndpoints = API_ENDPOINTS.filter(e => e.category === selectedCategory);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const firstEndpoint = API_ENDPOINTS.find(e => e.category === category);
    setSelectedEndpoint(firstEndpoint || null);
    setParameters({});
    setRequestBody("");
    setResponse(null);
  };

  const handleEndpointChange = (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint);
    setParameters({});
    setResponse(null);
    
    // Initialize request body if endpoint has one
    if (endpoint.requestBody?.example) {
      setRequestBody(JSON.stringify(endpoint.requestBody.example, null, 2));
    } else {
      setRequestBody("");
    }
  };

  const handleParameterChange = (name: string, value: string) => {
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  const buildUrl = () => {
    if (!selectedEndpoint) return "";
    
    let url = selectedEndpoint.path;
    const queryParams: string[] = [];
    
    // Replace path parameters
    selectedEndpoint.parameters?.forEach(param => {
      const value = parameters[param.name];
      if (param.in === "path" && value) {
        url = url.replace(`{${param.name}}`, value);
      }
    });
    
    // Add query parameters
    selectedEndpoint.parameters?.forEach(param => {
      const value = parameters[param.name];
      if (param.in === "query" && value) {
        queryParams.push(`${param.name}=${encodeURIComponent(value)}`);
      }
    });
    
    if (queryParams.length > 0) {
      url += "?" + queryParams.join("&");
    }
    
    return url;
  };

  const handleTryIt = async () => {
    if (!selectedEndpoint) return;
    
    setIsLoading(true);
    setResponse(null);
    
    try {
      // Build the full URL (paths in api-docs already include /api prefix)
      const path = buildUrl();
      const url = path.startsWith('/api') ? path : `/api${path}`;
      
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      // Add API key if provided
      if (apiKey && selectedEndpoint.authentication === "api-key") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }
      
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers,
      };
      
      // Always include credentials for same-origin requests to send session cookies
      options.credentials = "same-origin";
      
      // Add request body
      if (requestBody && ["POST", "PATCH", "PUT"].includes(selectedEndpoint.method)) {
        try {
          // Validate JSON
          JSON.parse(requestBody);
          options.body = requestBody;
        } catch (e) {
          toast.error("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }
      
      const fetchResponse = await fetch(url, options);
      
      let data;
      const contentType = fetchResponse.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        data = await fetchResponse.json();
      } else {
        data = await fetchResponse.text();
      }
      
      setResponse({
        status: fetchResponse.status,
        statusText: fetchResponse.statusText,
        headers: Object.fromEntries(fetchResponse.headers.entries()),
        data,
      });
      
      if (fetchResponse.ok) {
        toast.success("Request successful!");
      } else {
        toast.error(`Request failed: ${fetchResponse.status}`);
      }
    } catch (error: any) {
      toast.error("Request failed: " + error.message);
      setResponse({
        error: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const generateCurl = () => {
    if (!selectedEndpoint) return "";
    
    const path = buildUrl();
    const url = path.startsWith('/api') ? path : `/api${path}`;
    let curl = `curl -X ${selectedEndpoint.method} "https://imaginears.club${url}"`;
    
    if (selectedEndpoint.authentication === "api-key") {
      curl += ` \\\n  -H "Authorization: Bearer ${apiKey || 'YOUR_API_KEY'}"`;
    }
    
    if (requestBody && ["POST", "PATCH", "PUT"].includes(selectedEndpoint.method)) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
      curl += ` \\\n  -d '${requestBody}'`;
    }
    
    return curl;
  };

  if (!selectedEndpoint) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Sidebar - Categories & Endpoints */}
      <div className="lg:col-span-3 space-y-4">
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
                  onClick={() => handleCategoryChange(category.id)}
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

        {/* Endpoints List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Endpoints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {categoryEndpoints.map((endpoint) => (
              <button
                key={endpoint.id}
                onClick={() => handleEndpointChange(endpoint)}
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

      {/* Main Content - Endpoint Details */}
      <div className="lg:col-span-9 space-y-6">
        {/* Endpoint Header */}
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

        {/* Authentication Info */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                  Authentication: {selectedEndpoint.authentication}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {selectedEndpoint.authentication === "api-key" && (
                    <>Required scope: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{selectedEndpoint.requiredScope}</code></>
                  )}
                  {selectedEndpoint.authentication === "admin" && "Requires admin session cookie (uses your current login)"}
                  {selectedEndpoint.authentication === "session" && "Requires authenticated session (uses your current login)"}
                  {selectedEndpoint.authentication === "public" && "No authentication required"}
                </div>
                
                {/* API Key Input Field */}
                {selectedEndpoint.authentication === "api-key" && (
                  <div className="mt-3">
                    <Label htmlFor="api-key-input" className="text-xs font-semibold mb-1 block">
                      API Key
                    </Label>
                    <Input
                      id="api-key-input"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Enter your API key..."
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Manage your API keys in <a href="/profile" className="text-blue-600 dark:text-blue-400 hover:underline">Profile → API Keys</a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters */}
        {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedEndpoint.parameters.map((param) => (
                <div key={param.name} className="space-y-2">
                  <Label htmlFor={`param-${param.name}`} className="flex items-center gap-2">
                    <span>{param.name}</span>
                    {param.required && (
                      <span className="text-xs text-red-600 dark:text-red-400">*required</span>
                    )}
                    <span className="text-xs text-slate-500">({param.in})</span>
                  </Label>
                  <div className="flex gap-2">
                    {param.enum ? (
                      <select
                        id={`param-${param.name}`}
                        value={parameters[param.name] || ""}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                      >
                        <option value="">Select {param.name}...</option>
                        {param.enum.map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={`param-${param.name}`}
                        type={param.type === "number" ? "number" : "text"}
                        value={parameters[param.name] || ""}
                        onChange={(e) => handleParameterChange(param.name, e.target.value)}
                        placeholder={param.default ? `Default: ${param.default}` : `Enter ${param.name}...`}
                        className="flex-1"
                      />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {param.description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Request Body */}
        {selectedEndpoint.requestBody && ["POST", "PATCH", "PUT"].includes(selectedEndpoint.method) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Request Body</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="w-full h-48 px-3 py-2 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none"
                placeholder="Enter JSON request body..."
              />
            </CardContent>
          </Card>
        )}

        {/* Try It Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleTryIt}
            disabled={isLoading}
            className="gap-2"
            size="lg"
          >
            <Play className="w-4 h-4" />
            {isLoading ? "Sending..." : "Try It Out"}
          </Button>
          <Button
            onClick={() => {
              setResponse(null);
              setParameters({});
              setApiKey("");
              setRequestBody(selectedEndpoint.requestBody?.example ? JSON.stringify(selectedEndpoint.requestBody.example, null, 2) : "");
            }}
            variant="outline"
            size="lg"
          >
            Reset
          </Button>
        </div>

        {/* Response */}
        {response && (
          <Card className={cn(
            "border-l-4",
            response.status >= 200 && response.status < 300
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
        )}

        {/* Code Examples */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="w-4 h-4" />
              Code Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generated cURL */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">Generated cURL</Label>
                <Button
                  onClick={() => copyCode(generateCurl(), "curl-generated")}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {copiedCode === "curl-generated" ? (
                    <><Check className="w-3 h-3" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </Button>
              </div>
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{generateCurl()}</code>
              </pre>
            </div>

            {/* Example from docs */}
            {selectedEndpoint.examples.map((example) => (
              <div key={example.title}>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">{example.title}</Label>
                  <Button
                    onClick={() => copyCode(example.code, example.title)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copiedCode === example.title ? (
                      <><Check className="w-3 h-3" /> Copied</>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy</>
                    )}
                  </Button>
                </div>
                <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Responses Documentation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedEndpoint.responses.map((resp) => (
              <div key={resp.status} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "text-sm font-mono font-bold px-2 py-1 rounded",
                    resp.status >= 200 && resp.status < 300
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {resp.status}
                  </span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {resp.description}
                  </span>
                </div>
                {resp.example && (
                  <pre className="bg-slate-100 dark:bg-slate-900 p-3 rounded text-xs overflow-x-auto mt-2">
                    <code>{JSON.stringify(resp.example, null, 2)}</code>
                  </pre>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

