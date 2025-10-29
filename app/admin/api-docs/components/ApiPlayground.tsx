"use client";

import { useState } from "react";
import { Button } from "@/components/common";
import { type ApiEndpoint } from "@/lib/api-docs";
import { Play } from "lucide-react";
import { toast } from "sonner";
import { PlaygroundForm } from "./PlaygroundForm";
import { PlaygroundResponse } from "./PlaygroundResponse";
import { CodeExamples } from "./CodeExamples";
import { useApiPlaygroundActions } from "./ApiPlaygroundActions";

interface ApiPlaygroundProps {
  endpoint: ApiEndpoint;
}

export function ApiPlayground({ endpoint }: ApiPlaygroundProps) {
  const [parameters, setParameters] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState(
    endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : ""
  );
  const [apiKey, setApiKey] = useState("");
  const [response, setResponse] = useState<{
    status?: number;
    statusText?: string;
    headers?: Record<string, string>;
    data?: unknown;
    error?: string;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { isLoading, handleTryIt, buildCurl } = useApiPlaygroundActions({
    endpoint,
    parameters,
    requestBody,
    apiKey,
    onResponse: setResponse,
  });

  const copyCode = (code: string, id: string) => {
    if (typeof window !== "undefined" && window.navigator?.clipboard) {
      window.navigator.clipboard.writeText(code);
      setCopiedCode(id);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <PlaygroundForm
        endpoint={endpoint}
        parameters={parameters}
        requestBody={requestBody}
        apiKey={apiKey}
        onParameterChange={(name, value) => setParameters({ ...parameters, [name]: value })}
        onRequestBodyChange={setRequestBody}
        onApiKeyChange={setApiKey}
      />

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleTryIt} disabled={isLoading} className="gap-2" size="lg">
          <Play className="w-4 h-4" />
          {isLoading ? "Sending..." : "Try It Out"}
        </Button>
        <Button
          onClick={() => {
            setResponse(null);
            setParameters({});
            setApiKey("");
            setRequestBody(endpoint.requestBody?.example ? JSON.stringify(endpoint.requestBody.example, null, 2) : "");
          }}
          variant="outline"
          size="lg"
        >
          Reset
        </Button>
      </div>

      {response && <PlaygroundResponse response={response} />}

      <CodeExamples
        endpoint={endpoint}
        generatedCurl={buildCurl()}
        copiedCode={copiedCode}
        onCopy={copyCode}
      />
    </div>
  );
}

