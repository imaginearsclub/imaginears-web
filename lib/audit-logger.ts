/**
 * Audit Logging Utilities
 * 
 * Comprehensive logging for security-sensitive operations
 */

export type AuditAction =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "role.assigned"
  | "role.created"
  | "role.updated"
  | "role.deleted"
  | "api_key.created"
  | "api_key.updated"
  | "api_key.deleted"
  | "api_key.accessed"
  | "session.created"
  | "session.revoked"
  | "login.success"
  | "login.failed"
  | "password.changed"
  | "2fa.enabled"
  | "2fa.disabled"
  | "bulk.operation";

export interface AuditLogEntry {
  timestamp: string;
  action: AuditAction;
  actor: {
    id: string;
    email?: string;
    role?: string;
  };
  target?: {
    id?: string;
    type?: string;
    name?: string;
  };
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  error?: string;
}

/**
 * Log an audit event
 * In production, this should write to a dedicated audit log table or service
 * 
 * @param entry - Audit log entry
 */
export function logAudit(entry: AuditLogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // For now, log to console
  // In production, write to dedicated audit log table or service
  console.log(
    `[AUDIT] ${logEntry.action} by ${logEntry.actor.email || logEntry.actor.id} - ${
      logEntry.success ? "SUCCESS" : "FAILED"
    }`,
    JSON.stringify(logEntry, null, 2)
  );

  // TODO: Write to database audit_logs table
  // await prisma.auditLog.create({ data: logEntry });
}

/**
 * Create audit log for user creation
 */
export function logUserCreated(
  actorId: string,
  actorEmail: string,
  actorRole: string,
  targetUserId: string,
  targetEmail: string,
  targetRole: string,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "user.created",
    actor: {
      id: actorId,
      email: actorEmail,
      role: actorRole,
    },
    target: {
      id: targetUserId,
      type: "user",
      name: targetEmail,
    },
    details: {
      assignedRole: targetRole,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for user update
 */
export function logUserUpdated(
  actorId: string,
  actorEmail: string,
  targetUserId: string,
  targetEmail: string,
  changes: Record<string, unknown>,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "user.updated",
    actor: {
      id: actorId,
      email: actorEmail,
    },
    target: {
      id: targetUserId,
      type: "user",
      name: targetEmail,
    },
    details: {
      changes,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for user deletion
 */
export function logUserDeleted(
  actorId: string,
  actorEmail: string,
  targetUserId: string,
  targetEmail: string,
  targetRole: string,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "user.deleted",
    actor: {
      id: actorId,
      email: actorEmail,
    },
    target: {
      id: targetUserId,
      type: "user",
      name: targetEmail,
    },
    details: {
      deletedRole: targetRole,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for role assignment
 */
export function logRoleAssigned(
  actorId: string,
  actorEmail: string,
  targetUserId: string,
  targetEmail: string,
  oldRole: string,
  newRole: string,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "role.assigned",
    actor: {
      id: actorId,
      email: actorEmail,
    },
    target: {
      id: targetUserId,
      type: "user",
      name: targetEmail,
    },
    details: {
      oldRole,
      newRole,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for custom role creation
 */
export function logRoleCreated(
  actorId: string,
  actorEmail: string,
  roleName: string,
  roleSlug: string,
  permissions: string[],
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "role.created",
    actor: {
      id: actorId,
      email: actorEmail,
    },
    target: {
      type: "role",
      name: roleName,
    },
    details: {
      slug: roleSlug,
      permissions,
      permissionCount: permissions.length,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for bulk operations
 */
export function logBulkOperation(
  actorId: string,
  actorEmail: string,
  operation: string,
  affectedCount: number,
  details?: Record<string, unknown>,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action: "bulk.operation",
    actor: {
      id: actorId,
      email: actorEmail,
    },
    details: {
      operation,
      affectedCount,
      ...details,
    },
    ipAddress,
    success: true,
  });
}

/**
 * Create audit log for failed operations
 */
export function logOperationFailed(
  action: AuditAction,
  actorId: string,
  actorEmail: string,
  error: string,
  details?: Record<string, unknown>,
  ipAddress?: string
): void {
  logAudit({
    timestamp: new Date().toISOString(),
    action,
    actor: {
      id: actorId,
      email: actorEmail,
    },
    details,
    ipAddress,
    success: false,
    error,
  });
}

/**
 * Sanitize sensitive data before logging
 * Removes passwords, tokens, keys, etc.
 */
export function sanitizeForAudit(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...data };
  const sensitiveFields = [
    "password",
    "token",
    "key",
    "secret",
    "apiKey",
    "accessToken",
    "refreshToken",
    "hash",
  ];

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }

  return sanitized;
}

