'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common';
import { Download, FileText, FileJson, File } from 'lucide-react';
import { Button } from '@/components/common';

export function SessionExportTools() {
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json' | 'pdf'>('csv');
  const [type, setType] = useState<'sessions' | 'activities'>('sessions');
  const [includeActivities, setIncludeActivities] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('30d');

  const handleExport = async () => {
    setExporting(true);
    
    try {
      // Calculate date range
      const now = new Date();
      let fromDate: Date | undefined;
      
      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }

      // Build query params
      const params = new URLSearchParams({
        format,
        type,
        includeActivities: includeActivities.toString(),
      });

      if (fromDate) {
        params.append('from', fromDate.toISOString());
      }
      params.append('to', now.toISOString());

      // Fetch export
      const response = await fetch(`/api/user/sessions/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get filename from header or generate one
      const contentDisposition = response.headers.get('content-disposition');
      let filename: string;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.split('filename=')[1];
        filename = filenameMatch ? filenameMatch.replace(/"/g, '') : `session-export-${new Date().toISOString().split('T')[0]}.${format}`;
      } else {
        filename = `session-export-${new Date().toISOString().split('T')[0]}.${format}`;
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          <CardTitle className="text-base">Export Session Data</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Type */}
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
            Data Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setType('sessions')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                type === 'sessions'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Sessions</span>
              </div>
            </button>
            <button
              onClick={() => setType('activities')}
              className={`p-3 rounded-lg border-2 transition-colors ${
                type === 'activities'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Activities</span>
              </div>
            </button>
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
            Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            <FormatButton
              icon={FileText}
              label="CSV"
              selected={format === 'csv'}
              onClick={() => setFormat('csv')}
            />
            <FormatButton
              icon={FileJson}
              label="JSON"
              selected={format === 'json'}
              onClick={() => setFormat('json')}
            />
            <FormatButton
              icon={File}
              label="PDF"
              selected={format === 'pdf'}
              onClick={() => setFormat('pdf')}
            />
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium text-slate-900 dark:text-white block mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <DateRangeButton
              label="Last 7 days"
              selected={dateRange === '7d'}
              onClick={() => setDateRange('7d')}
            />
            <DateRangeButton
              label="Last 30 days"
              selected={dateRange === '30d'}
              onClick={() => setDateRange('30d')}
            />
            <DateRangeButton
              label="Last 90 days"
              selected={dateRange === '90d'}
              onClick={() => setDateRange('90d')}
            />
            <DateRangeButton
              label="All time"
              selected={dateRange === 'all'}
              onClick={() => setDateRange('all')}
            />
          </div>
        </div>

        {/* Options */}
        {type === 'sessions' && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeActivities}
                onChange={(e) => setIncludeActivities(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Include activity details
              </span>
            </label>
          </div>
        )}

        {/* Export Button */}
        <Button
          onClick={handleExport}
          disabled={exporting}
          className="w-full"
          size="lg"
        >
          {exporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating Export...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export {format.toUpperCase()}
            </>
          )}
        </Button>

        {/* Info */}
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <div className="text-xs text-blue-700 dark:text-blue-300">
            <div className="font-semibold mb-1">GDPR Compliant</div>
            <div>
              Your data export includes all information we have about your sessions and activities. 
              You can request this export at any time as part of your data rights.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FormatButton({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: any;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg border-2 transition-colors ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <div className="text-xs font-medium">{label}</div>
    </button>
  );
}

function DateRangeButton({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg border-2 transition-colors text-sm ${
        selected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 font-medium'
          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      {label}
    </button>
  );
}

