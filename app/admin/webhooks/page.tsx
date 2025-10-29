"use client";

import { useState } from "react";
import { Card, Button, EmptyState, Skeleton } from "@/components/common";
import { Webhook, Plus } from "lucide-react";
import { CreateWebhookDrawer } from "./components/CreateWebhookDrawer";
import { EditWebhookDrawer } from "./components/EditWebhookDrawer";
import { DeliveryLogsDrawer } from "./components/DeliveryLogsDrawer";
import { WebhookCard } from "./components/WebhookCard";
import { useWebhooks } from "./hooks/useWebhooks";
import type { WebhookItem } from "./types";

const SKELETON_ITEMS = ['webhook-1', 'webhook-2', 'webhook-3', 'webhook-4', 'webhook-5', 'webhook-6'] as const;

export default function WebhooksPage() {
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [editWebhook, setEditWebhook] = useState<WebhookItem | null>(null);
  const [viewLogsWebhook, setViewLogsWebhook] = useState<WebhookItem | null>(null);

  const { webhooks, loading, loadWebhooks, handleToggleActive, handleTest, handleDelete } = useWebhooks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Webhooks</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Configure webhooks to receive real-time notifications for events
          </p>
        </div>

        <Button onClick={() => setShowCreateDrawer(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {/* Webhooks List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_ITEMS.map((id) => (
            <Card key={id} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Webhook className="w-12 h-12" />}
            title="No webhooks configured"
            description="Create your first webhook to start receiving real-time event notifications"
            action={
              <Button onClick={() => setShowCreateDrawer(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Webhook
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {webhooks.map((webhook) => (
            <WebhookCard
              key={webhook.id}
              webhook={webhook}
              onEdit={setEditWebhook}
              onTest={handleTest}
              onViewLogs={setViewLogsWebhook}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Drawers */}
      <CreateWebhookDrawer
        open={showCreateDrawer}
        onOpenChange={setShowCreateDrawer}
        onSuccess={loadWebhooks}
      />

      {editWebhook && (
        <EditWebhookDrawer
          webhook={editWebhook}
          open={!!editWebhook}
          onOpenChange={(open: boolean) => !open && setEditWebhook(null)}
          onSuccess={loadWebhooks}
        />
      )}

      {viewLogsWebhook && (
        <DeliveryLogsDrawer
          webhook={viewLogsWebhook}
          open={!!viewLogsWebhook}
          onOpenChange={(open: boolean) => !open && setViewLogsWebhook(null)}
        />
      )}
    </div>
  );
}

