import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Input } from '@/components/common';
import { UserX, UserCheck, Shield, Key, Mail } from 'lucide-react';
import { OperationButton } from './OperationButton';

type BulkOperation = 'suspend' | 'activate' | 'change-role' | 'reset-password' | 'send-email';

interface OperationSelectorProps {
  operation: BulkOperation | null;
  /* eslint-disable-next-line no-unused-vars */
  onOperationChange: (op: BulkOperation) => void;
  newRole: string;
  /* eslint-disable-next-line no-unused-vars */
  onRoleChange: (role: string) => void;
  emailSubject: string;
  /* eslint-disable-next-line no-unused-vars */
  onEmailSubjectChange: (subject: string) => void;
  emailBody: string;
  /* eslint-disable-next-line no-unused-vars */
  onEmailBodyChange: (body: string) => void;
}

export const OperationSelector = memo(function OperationSelector({
  operation,
  onOperationChange,
  newRole,
  onRoleChange,
  emailSubject,
  onEmailSubjectChange,
  emailBody,
  onEmailBodyChange,
}: OperationSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Select Bulk Operation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <OperationButton
            icon={UserX}
            label="Suspend Users"
            selected={operation === 'suspend'}
            onClick={() => onOperationChange('suspend')}
            color="red"
          />
          <OperationButton
            icon={UserCheck}
            label="Activate Users"
            selected={operation === 'activate'}
            onClick={() => onOperationChange('activate')}
            color="green"
          />
          <OperationButton
            icon={Shield}
            label="Change Roles"
            selected={operation === 'change-role'}
            onClick={() => onOperationChange('change-role')}
            color="blue"
          />
          <OperationButton
            icon={Key}
            label="Reset Passwords"
            selected={operation === 'reset-password'}
            onClick={() => onOperationChange('reset-password')}
            color="orange"
          />
          <OperationButton
            icon={Mail}
            label="Send Email"
            selected={operation === 'send-email'}
            onClick={() => onOperationChange('send-email')}
            color="purple"
          />
        </div>

        {operation === 'change-role' && (
          <div className="mt-4">
            <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
              New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
            >
              <option value="USER">User</option>
              <option value="STAFF">Staff</option>
              <option value="MODERATOR">Moderator</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        )}

        {operation === 'send-email' && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Email Subject
              </label>
              <Input
                value={emailSubject}
                onChange={(e) => onEmailSubjectChange(e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                Email Body
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => onEmailBodyChange(e.target.value)}
                placeholder="Enter email body..."
                className="w-full h-32 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

