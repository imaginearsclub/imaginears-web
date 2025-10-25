"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from "@/components/common";
import { Key, Copy, Trash2, Eye, EyeOff, Plus, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  rateLimit: number;
  lastUsedAt: Date | null;
  usageCount: number;
  description: string | null;
  expiresAt: Date | null;
  createdAt: Date;
}

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
}

// Available scopes
const AVAILABLE_SCOPES = [
  { value: "public:read", label: "Public Read", description: "Read public data" },
  { value: "events:read", label: "Events Read", description: "Read event information" },
  { value: "events:write", label: "Events Write", description: "Create and modify events" },
  { value: "server:read", label: "Server Read", description: "Read server status" },
];

export function ApiKeysSection({ apiKeys: initialApiKeys }: ApiKeysSectionProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["public:read"]);
  const [rateLimit, setRateLimit] = useState("100");

  const handleCreateKey = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    if (selectedScopes.length === 0) {
      toast.error("Please select at least one scope");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          scopes: selectedScopes,
          rateLimit: parseInt(rateLimit),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create API key");
      }

      setNewKey(data.apiKey.key);
      setApiKeys(prev => [data.apiKey, ...prev]);
      
      // Reset form
      setName("");
      setDescription("");
      setSelectedScopes(["public:read"]);
      setRateLimit("100");
      
      toast.success("API key created successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to create API key");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete API key");
      }

      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success("API key deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete API key");
    }
  };

  const handleToggleActive = async (id: string, currentState: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentState }),
      });

      if (!response.ok) {
        throw new Error("Failed to update API key");
      }

      const data = await response.json();
      setApiKeys(prev => prev.map(k => k.id === id ? data.apiKey : k));
      toast.success(`API key ${!currentState ? "enabled" : "disabled"}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            API Keys
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage API keys for programmatic access to Imaginears services
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Create API Key
        </Button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create New API Key</CardTitle>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewKey(null);
                }}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                ✕
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {newKey ? (
              // Show the newly created key
              <div className="space-y-4">
                <div className="bg-green-50 dark:bg-green-950/30 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex gap-2 items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                        API Key Created Successfully!
                      </p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        Make sure to copy your API key now. You won't be able to see it again!
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Your API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      onClick={() => copyToClipboard(newKey)}
                      variant="outline"
                      size="sm"
                      className="gap-2 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewKey(null);
                  }}
                  className="w-full"
                >
                  Done
                </Button>
              </div>
            ) : (
              // Creation form
              <>
                <div>
                  <Label htmlFor="api-key-name">Name *</Label>
                  <Input
                    id="api-key-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Mobile App, Analytics Service"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <Label htmlFor="api-key-description">Description</Label>
                  <Input
                    id="api-key-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional description"
                    disabled={isCreating}
                  />
                </div>

                <div>
                  <Label>Scopes *</Label>
                  <div className="mt-2 space-y-2">
                    {AVAILABLE_SCOPES.map((scope) => (
                      <label
                        key={scope.value}
                        className="flex items-start gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedScopes.includes(scope.value)}
                          onChange={() => toggleScope(scope.value)}
                          disabled={isCreating}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-slate-900 dark:text-white">
                            {scope.label}
                          </div>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {scope.description}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="api-key-rate-limit">Rate Limit (requests per minute)</Label>
                  <Input
                    id="api-key-rate-limit"
                    type="number"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    min="1"
                    max="10000"
                    disabled={isCreating}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateKey}
                    disabled={isCreating}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create API Key"}
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(false)}
                    variant="outline"
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Key className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                No API Keys Yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Create your first API key to access Imaginears services programmatically
              </p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First API Key
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className={cn(!apiKey.isActive && "opacity-60")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      apiKey.isActive
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-slate-100 dark:bg-slate-800"
                    )}>
                      <Key className={cn(
                        "w-5 h-5",
                        apiKey.isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-slate-400"
                      )} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{apiKey.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          {apiKey.keyPrefix}...
                        </code>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full",
                          apiKey.isActive
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        )}>
                          {apiKey.isActive ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                      variant="outline"
                      size="sm"
                    >
                      {apiKey.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      onClick={() => handleDeleteKey(apiKey.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {apiKey.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {apiKey.description}
                  </p>
                )}
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Scopes</span>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {Array.isArray(apiKey.scopes) ? apiKey.scopes.length : 0}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Rate Limit</span>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {apiKey.rateLimit || 100}/min
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Usage</span>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {(apiKey.usageCount || 0).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Last Used</span>
                    <div className="font-medium text-slate-900 dark:text-white text-xs">
                      {apiKey.lastUsedAt 
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                        : "Never"
                      }
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Permissions:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(apiKey.scopes) && apiKey.scopes.length > 0 ? (
                      apiKey.scopes.map((scope) => (
                        <span
                          key={scope}
                          className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {scope}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        No permissions
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

