/**
 * Validation Schemas for Bulk Users API
 * 
 * Zod schemas for validating bulk user operations
 */

import { z } from 'zod';

/**
 * Valid bulk operations
 */
export const BulkOperation = {
  SUSPEND: 'suspend',
  ACTIVATE: 'activate',
  CHANGE_ROLE: 'change-role',
  RESET_PASSWORD: 'reset-password',
  SEND_EMAIL: 'send-email',
} as const;

export type BulkOperationType = (typeof BulkOperation)[keyof typeof BulkOperation];

/**
 * Valid user roles
 */
export const UserRole = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  GUEST: 'GUEST',
  PLAYER: 'PLAYER',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/**
 * Base schema for all bulk operations
 */
const baseBulkOperationSchema = z.object({
  operation: z.enum([
    BulkOperation.SUSPEND,
    BulkOperation.ACTIVATE,
    BulkOperation.CHANGE_ROLE,
    BulkOperation.RESET_PASSWORD,
    BulkOperation.SEND_EMAIL,
  ], {
    message: 'Invalid operation type',
  }),
  users: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one user email is required')
    .max(100, 'Cannot process more than 100 users at once'),
  dryRun: z.boolean().optional().default(false),
});

/**
 * Schema for suspend operation
 */
export const suspendOperationSchema = baseBulkOperationSchema.extend({
  operation: z.literal(BulkOperation.SUSPEND),
});

/**
 * Schema for activate operation
 */
export const activateOperationSchema = baseBulkOperationSchema.extend({
  operation: z.literal(BulkOperation.ACTIVATE),
});

/**
 * Schema for change-role operation
 */
export const changeRoleOperationSchema = baseBulkOperationSchema.extend({
  operation: z.literal(BulkOperation.CHANGE_ROLE),
  newRole: z.enum([UserRole.ADMIN, UserRole.STAFF, UserRole.GUEST, UserRole.PLAYER], {
    message: 'Invalid role. Must be ADMIN, STAFF, GUEST, or PLAYER',
  }),
});

/**
 * Schema for reset-password operation
 */
export const resetPasswordOperationSchema = baseBulkOperationSchema.extend({
  operation: z.literal(BulkOperation.RESET_PASSWORD),
});

/**
 * Schema for send-email operation
 */
export const sendEmailOperationSchema = baseBulkOperationSchema.extend({
  operation: z.literal(BulkOperation.SEND_EMAIL),
  emailSubject: z
    .string()
    .min(1, 'Email subject is required')
    .max(200, 'Email subject cannot exceed 200 characters'),
  emailBody: z
    .string()
    .min(1, 'Email body is required')
    .max(10000, 'Email body cannot exceed 10,000 characters'),
});

/**
 * Combined schema that validates based on operation type
 */
export const bulkUserOperationSchema = z.discriminatedUnion('operation', [
  suspendOperationSchema,
  activateOperationSchema,
  changeRoleOperationSchema,
  resetPasswordOperationSchema,
  sendEmailOperationSchema,
]);

export type BulkUserOperation = z.infer<typeof bulkUserOperationSchema>;
export type SuspendOperation = z.infer<typeof suspendOperationSchema>;
export type ActivateOperation = z.infer<typeof activateOperationSchema>;
export type ChangeRoleOperation = z.infer<typeof changeRoleOperationSchema>;
export type ResetPasswordOperation = z.infer<typeof resetPasswordOperationSchema>;
export type SendEmailOperation = z.infer<typeof sendEmailOperationSchema>;

/**
 * Response types
 */
export interface BulkOperationResult {
  success: number;
  failed: number;
  total: number;
  operation: BulkOperationType;
  errors: string[];
  dryRun?: boolean;
  preview?: Array<{
    email: string;
    action: string;
  }>;
}

/**
 * Permission mapping for operations
 */
export const OPERATION_PERMISSIONS: Record<BulkOperationType, string> = {
  [BulkOperation.SUSPEND]: 'users:bulk_suspend',
  [BulkOperation.ACTIVATE]: 'users:bulk_activate',
  [BulkOperation.CHANGE_ROLE]: 'users:bulk_change_roles',
  [BulkOperation.RESET_PASSWORD]: 'users:bulk_reset_passwords',
  [BulkOperation.SEND_EMAIL]: 'users:bulk_send_email',
};

