"use client";

import { Card, CardContent, CardHeader, CardTitle, Input, Label } from "@/components/common";
import { type ApiEndpoint } from "@/lib/api-docs";
import { Shield } from "lucide-react";

interface PlaygroundFormProps {
  endpoint: ApiEndpoint;
  parameters: Record<string, string>;
  requestBody: string;
  apiKey: string;
  // eslint-disable-next-line no-unused-vars
  onParameterChange: (_name: string, _value: string) => void;
  // eslint-disable-next-line no-unused-vars
  onRequestBodyChange: (_value: string) => void;
  // eslint-disable-next-line no-unused-vars
  onApiKeyChange: (_value: string) => void;
}

export function PlaygroundForm({
  endpoint,
  parameters,
  requestBody,
  apiKey,
  onParameterChange,
  onRequestBodyChange,
  onApiKeyChange,
}: PlaygroundFormProps) {
  return (
    <>
      {/* Auth Info */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">Authentication: {endpoint.authentication}</div>
              {endpoint.authentication === "api-key" && (
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Required scope: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{endpoint.requiredScope}</code>
                  </p>
                  <Label htmlFor="api-key-input" className="text-xs font-semibold mb-1 block">API Key</Label>
                  <Input
                    id="api-key-input"
                    type="password"
                    value={apiKey}
                    onChange={(e) => onApiKeyChange(e.target.value)}
                    placeholder="Enter your API key..."
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters */}
      {endpoint.parameters && endpoint.parameters.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {endpoint.parameters.map((param) => (
              <div key={param.name} className="space-y-2">
                <Label htmlFor={`param-${param.name}`} className="flex items-center gap-2">
                  <span>{param.name}</span>
                  {param.required && <span className="text-xs text-red-600 dark:text-red-400">*required</span>}
                  <span className="text-xs text-slate-500">({param.in})</span>
                </Label>
                {param.enum ? (
                  <select
                    id={`param-${param.name}`}
                    value={parameters[param.name] || ""}
                    onChange={(e) => onParameterChange(param.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-sm"
                  >
                    <option value="">Select {param.name}...</option>
                    {param.enum.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                ) : (
                  <Input
                    id={`param-${param.name}`}
                    type={param.type === "number" ? "number" : "text"}
                    value={parameters[param.name] || ""}
                    onChange={(e) => onParameterChange(param.name, e.target.value)}
                    placeholder={param.default ? `Default: ${param.default}` : `Enter ${param.name}...`}
                  />
                )}
                <p className="text-xs text-slate-600 dark:text-slate-400">{param.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Request Body */}
      {endpoint.requestBody && ["POST", "PATCH", "PUT"].includes(endpoint.method) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Request Body</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              value={requestBody}
              onChange={(e) => onRequestBodyChange(e.target.value)}
              className="w-full h-48 px-3 py-2 font-mono text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none"
              placeholder="Enter JSON request body..."
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

