export interface WebhookItem {
  id: string;
  name: string;
  description: string | null;
  url: string;
  events: string[];
  active: boolean;
  integrationType: string | null;
  successCount: number;
  failureCount: number;
  lastTriggeredAt: string | null;
  deliveryCount: number;
  createdAt: string;
  healthStatus: string;
  consecutiveFailures: number;
  avgResponseTime: number | null;
  lastFailureReason: string | null;
  rateLimit: number | null;
  autoDisableThreshold: number;
}

