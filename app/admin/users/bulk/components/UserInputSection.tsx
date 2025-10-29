import { memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Tooltip } from '@/components/common';
import { Upload, Download, Users, CheckCircle } from 'lucide-react';
import { createSafeBlobDownload } from '@/lib/security-utils';

interface UserInputSectionProps {
  csvFile: File | null;
  previewCount: number;
  /* eslint-disable-next-line no-unused-vars */
  onFileChange: (file: File | null) => void;
  selectedCount: number;
  /* eslint-disable-next-line no-unused-vars */
  onTextInput: (text: string) => void;
}

export const UserInputSection = memo(function UserInputSection({
  csvFile,
  previewCount,
  onFileChange,
  selectedCount,
  onTextInput,
}: UserInputSectionProps) {
  const handleExportTemplate = useCallback(() => {
    const csv = 'email,name,role\njohn@example.com,John Doe,USER\njane@example.com,Jane Smith,STAFF';
    const blob = new Blob([csv], { type: 'text/csv' });
    createSafeBlobDownload(blob, 'bulk-users-template.csv');
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  }, [onFileChange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">CSV Import</CardTitle>
            <Tooltip content="Download CSV template">
              <Button variant="outline" size="sm" onClick={handleExportTemplate} aria-label="Download CSV template">
                <Download className="w-4 h-4" />
              </Button>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInput}
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
                    {previewCount} users loaded
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manual Input</CardTitle>
        </CardHeader>
        <CardContent>
          <textarea
            placeholder="Enter email addresses (comma or newline separated)&#10;&#10;john@example.com, jane@example.com&#10;bob@example.com"
            onChange={(e) => onTextInput(e.target.value)}
            className="w-full h-40 px-3 py-2 border-2 border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 resize-none text-sm font-mono"
          />
          
          {selectedCount > 0 && (
            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedCount} users selected
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

