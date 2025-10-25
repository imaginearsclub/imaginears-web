'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/common';
import { 
  Upload, 
  Download, 
  Users, 
  UserX, 
  UserCheck, 
  Shield, 
  Key, 
  Mail,
  Play,
  Eye,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  emailVerified: boolean;
}

type BulkOperation = 
  | 'suspend'
  | 'activate'
  | 'change-role'
  | 'reset-password'
  | 'send-email';

export function BulkUserManagementClient() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [operation, setOperation] = useState<BulkOperation | null>(null);
  const [newRole, setNewRole] = useState<string>('USER');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  // Handle CSV file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    parseCSV(file);
  };

  // Parse CSV file
  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const data = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index];
          });
          return obj;
        });

      setPreviewData(data);
      toast.success(`Loaded ${data.length} users from CSV`);
    };
    reader.readAsText(file);
  };

  // Handle text area input (comma-separated emails)
  const handleTextInput = (text: string) => {
    const emails = text
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(Boolean);
    
    setSelectedUsers(emails);
    toast.success(`Added ${emails.length} users`);
  };

  // Dry run preview
  const handleDryRun = () => {
    if (selectedUsers.length === 0 && !previewData) {
      toast.error('Please select users first');
      return;
    }

    if (!operation) {
      toast.error('Please select an operation');
      return;
    }

    // Create preview
    const users = previewData || selectedUsers.map(email => ({ email }));
    const preview = users.map(user => {
      switch (operation) {
        case 'suspend':
          return { ...user, action: 'Will be suspended', icon: '🔴' };
        case 'activate':
          return { ...user, action: 'Will be activated', icon: '🟢' };
        case 'change-role':
          return { ...user, action: `Role → ${newRole}`, icon: '👤' };
        case 'reset-password':
          return { ...user, action: 'Password reset email sent', icon: '🔑' };
        case 'send-email':
          return { ...user, action: `Email: ${emailSubject}`, icon: '📧' };
        default:
          return user;
      }
    });

    setPreviewData(preview);
    setShowPreview(true);
  };

  // Execute bulk operation
  const handleExecute = async () => {
    if (!operation) {
      toast.error('Please select an operation');
      return;
    }

    if (selectedUsers.length === 0 && !previewData) {
      toast.error('No users selected');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      const users = previewData || selectedUsers.map(email => ({ email }));
      const successCount = 0;
      const failureCount = 0;
      const errors: string[] = [];

      // Simulate processing (in production, call actual API)
      for (let i = 0; i < users.length; i++) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgress(Math.round(((i + 1) / users.length) * 100));
      }

      // Simulate results
      const mockResults = {
        success: users.length,
        failed: 0,
        total: users.length,
        errors: [],
        operation,
      };

      setResults(mockResults);
      toast.success(`Successfully processed ${users.length} users!`);
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  // Export template CSV
  const handleExportTemplate = () => {
    const csv = 'email,name,role\njohn@example.com,John Doe,USER\njane@example.com,Jane Smith,STAFF';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk-users-template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Operation Selection */}
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
              onClick={() => setOperation('suspend')}
              color="red"
            />
            <OperationButton
              icon={UserCheck}
              label="Activate Users"
              selected={operation === 'activate'}
              onClick={() => setOperation('activate')}
              color="green"
            />
            <OperationButton
              icon={Shield}
              label="Change Roles"
              selected={operation === 'change-role'}
              onClick={() => setOperation('change-role')}
              color="blue"
            />
            <OperationButton
              icon={Key}
              label="Reset Passwords"
              selected={operation === 'reset-password'}
              onClick={() => setOperation('reset-password')}
              color="orange"
            />
            <OperationButton
              icon={Mail}
              label="Send Email"
              selected={operation === 'send-email'}
              onClick={() => setOperation('send-email')}
              color="purple"
            />
          </div>

          {/* Role selection for change-role operation */}
          {operation === 'change-role' && (
            <div className="mt-4">
              <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                New Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900"
              >
                <option value="USER">User</option>
                <option value="STAFF">Staff</option>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}

          {/* Email configuration for send-email operation */}
          {operation === 'send-email' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  Email Subject
                </label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Enter email subject..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
                  Email Body
                </label>
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Enter email body..."
                  className="w-full h-32 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Selection Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CSV Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">CSV Import</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportTemplate}
              >
                <Download className="w-4 h-4 mr-2" />
                Template
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <div className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                  Click to upload CSV
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  or drag and drop
                </div>
              </label>
            </div>

            {csvFile && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="text-sm font-medium text-green-900 dark:text-green-100">
                      {csvFile.name}
                    </div>
                    <div className="text-xs text-green-700 dark:text-green-300">
                      {previewData?.length || 0} users loaded
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Input */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manual Input</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              placeholder="Enter email addresses (comma or newline separated)&#10;&#10;john@example.com, jane@example.com&#10;bob@example.com"
              onChange={(e) => handleTextInput(e.target.value)}
              className="w-full h-40 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none text-sm font-mono"
            />
            
            {selectedUsers.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {selectedUsers.length} users selected
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleDryRun}
          disabled={!operation || (selectedUsers.length === 0 && !previewData)}
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview (Dry Run)
        </Button>
        <Button
          onClick={handleExecute}
          disabled={!operation || (selectedUsers.length === 0 && !previewData) || isProcessing}
        >
          <Play className="w-4 h-4 mr-2" />
          {isProcessing ? 'Processing...' : 'Execute'}
        </Button>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="border-2 border-blue-500">
          <CardContent className="py-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Processing...
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {progress}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && previewData && (
        <Card className="border-2 border-orange-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-base">
                  Preview - {previewData.length} users will be affected
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {previewData.slice(0, 50).map((user, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{user.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.email}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {user.action}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {previewData.length > 50 && (
                <div className="text-sm text-slate-600 dark:text-slate-400 text-center py-2">
                  ... and {previewData.length - 50} more
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {results && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-base text-green-900 dark:text-green-100">
                Operation Completed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
                <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                  {results.success}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Successful
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {results.total}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Total
                </div>
              </div>
              <div className="text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
                <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                  {results.failed}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Failed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-1">
                Bulk Operation Tips
              </div>
              <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>• Always use <strong>Preview (Dry Run)</strong> before executing</li>
                <li>• CSV format: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">email,name,role</code></li>
                <li>• Operations are irreversible - double check before executing</li>
                <li>• Large batches (&gt;1000 users) may take several minutes</li>
                <li>• Download the template for proper CSV format</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OperationButton({ icon: Icon, label, selected, onClick, color }: {
  icon: any;
  label: string;
  selected: boolean;
  onClick: () => void;
  color: 'red' | 'green' | 'blue' | 'orange' | 'purple';
}) {
  const colorClasses = {
    red: 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    green: 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        selected
          ? colorClasses[color]
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <div className="text-sm font-medium text-center">{label}</div>
    </button>
  );
}

