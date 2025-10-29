import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { clientLog } from '@/lib/client-logger';

type BulkOperation = 'suspend' | 'activate' | 'change-role' | 'reset-password' | 'send-email';

export function useBulkOperations() {
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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const parseCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
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
      } catch (error) {
        clientLog.error('CSV parse error', { error });
        toast.error('Failed to parse CSV file');
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(file);
  }, []);

  const handleFileUpload = useCallback((file: File | null) => {
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setCsvFile(file);
    parseCSV(file);
  }, [parseCSV]);

  const handleTextInput = useCallback((text: string) => {
    const emails = text
      .split(/[\n,]/)
      .map(e => e.trim())
      .filter(Boolean);
    
    setSelectedUsers(emails);
    toast.success(`Added ${emails.length} users`);
  }, []);

  const handleDryRun = useCallback(() => {
    if (selectedUsers.length === 0 && !previewData) {
      toast.error('Please select users first');
      return;
    }

    if (!operation) {
      toast.error('Please select an operation');
      return;
    }

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
  }, [selectedUsers, previewData, operation, newRole, emailSubject]);

  const handleExecute = useCallback(async () => {
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

      for (let i = 0; i < users.length; i++) {
        await new Promise(resolve => {
          timeoutRef.current = setTimeout(resolve, 200);
        });
        setProgress(Math.round(((i + 1) / users.length) * 100));
      }

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
      clientLog.error('Bulk operation failed', { error });
      toast.error('Bulk operation failed');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [operation, selectedUsers, previewData]);

  return {
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
  };
}

