"use client";

import { Card, CardContent, CardHeader, CardTitle, Button, Label } from "@/components/common";
import { type ApiEndpoint } from "@/lib/api-docs";
import { Code, Copy, Check } from "lucide-react";

interface CodeExamplesProps {
  endpoint: ApiEndpoint;
  generatedCurl: string;
  copiedCode: string | null;
  // eslint-disable-next-line no-unused-vars
  onCopy: (_code: string, _id: string) => void;
}

export function CodeExamples({ endpoint, generatedCurl, copiedCode, onCopy }: CodeExamplesProps) {
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold">Generated cURL</Label>
              <Button onClick={() => onCopy(generatedCurl, "curl")} variant="outline" size="sm" className="gap-2">
                {copiedCode === "curl" ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
              </Button>
            </div>
            <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{generatedCurl}</code>
            </pre>
          </div>

          {endpoint.examples.map((example) => (
            <div key={example.title}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">{example.title}</Label>
                <Button onClick={() => onCopy(example.code, example.title)} variant="outline" size="sm" className="gap-2">
                  {copiedCode === example.title ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </Button>
              </div>
              <pre className="bg-slate-900 dark:bg-slate-950 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm">
                <code>{example.code}</code>
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Responses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpoint.responses.map((resp) => (
            <div key={resp.status} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-sm font-mono font-bold px-2 py-1 rounded ${
                  resp.status >= 200 && resp.status < 300
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {resp.status}
                </span>
                <span className="text-sm font-semibold">{resp.description}</span>
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
    </>
  );
}

