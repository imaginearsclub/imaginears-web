'use client';

import { memo } from 'react';
import { Button, Card, CardContent, Tooltip } from '@/components/common';
import { Play, Eye, AlertTriangle } from 'lucide-react';
import { useBulkOperations } from '../hooks/useBulkOperations';
import { OperationSelector } from './OperationSelector';
import { UserInputSection } from './UserInputSection';
import { ProgressCard } from './ProgressCard';
import { PreviewCard } from './PreviewCard';
import { ResultsCard } from './ResultsCard';

export const BulkUserManagementClient = memo(function BulkUserManagementClient() {
  const {
    selectedUsers,
    operation,
    setOperation,
    newRole,
    setNewRole,
    emailSubject,
    setEmailSubject,
    emailBody,
    setEmailBody,
    csvFile,
    previewData,
    showPreview,
    setShowPreview,
    isProcessing,
    progress,
    results,
    handleFileUpload,
    handleTextInput,
    handleDryRun,
    handleExecute,
  } = useBulkOperations();

  return (
    <div className="space-y-6">
      <OperationSelector
        operation={operation}
        onOperationChange={setOperation}
        newRole={newRole}
        onRoleChange={setNewRole}
        emailSubject={emailSubject}
        onEmailSubjectChange={setEmailSubject}
        emailBody={emailBody}
        onEmailBodyChange={setEmailBody}
      />

      <UserInputSection
        csvFile={csvFile}
        previewCount={previewData?.length || 0}
        onFileChange={handleFileUpload}
        selectedCount={selectedUsers.length}
        onTextInput={handleTextInput}
      />

      <div className="flex justify-end gap-3">
        <Tooltip content="Preview changes before executing (Dry Run)">
          <Button
            variant="outline"
            onClick={handleDryRun}
            disabled={!operation || (selectedUsers.length === 0 && !previewData)}
            aria-label="Preview (Dry Run)"
          >
            <Eye className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content={isProcessing ? "Processing bulk operation..." : "Execute bulk operation"}>
          <Button
            onClick={handleExecute}
            disabled={!operation || (selectedUsers.length === 0 && !previewData) || isProcessing}
            aria-label={isProcessing ? "Processing..." : "Execute"}
          >
            <Play className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>

      {isProcessing && <ProgressCard progress={progress} />}

      {showPreview && previewData && (
        <PreviewCard data={previewData} onClose={() => setShowPreview(false)} />
      )}

      {results && <ResultsCard results={results} />}

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
});

