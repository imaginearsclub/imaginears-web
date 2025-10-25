"use client";

import { useState } from "react";
import { Button, Input, Label, ConfirmDialog } from "@/components/common";
import { Download, Trash2, AlertTriangle, Shield, FileJson } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface GDPRDataManagementProps {
  hasPassword: boolean;
}

export function GDPRDataManagement({ hasPassword }: GDPRDataManagementProps) {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/user/export");
      
      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      // Get the blob and create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `imaginears-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Your data has been exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") {
      toast.error("Please type 'DELETE MY ACCOUNT' to confirm");
      return;
    }

    if (hasPassword && !deletePassword) {
      toast.error("Please enter your password");
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmText: deleteConfirmText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete account");
      }

      toast.success("Account deleted successfully. Goodbye! 👋");
      
      // Redirect to home after short delay
      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete account");
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Export */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Export Your Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Download a copy of all your personal data in JSON format. This includes your profile, 
              settings, events, applications, and activity history.
            </p>
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              variant="outline"
              className="gap-2"
            >
              <FileJson className="w-4 h-4" />
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </div>
        </div>
      </div>

      {/* Data Deletion */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Delete Account
            </h3>
            <div className="space-y-2 mb-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 p-3 rounded-r-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 dark:text-amber-100">
                    <strong>Warning:</strong> Deleting your account will permanently remove:
                    <ul className="mt-1 ml-4 space-y-0.5">
                      <li>Your profile and settings</li>
                      <li>Your activity history</li>
                      <li>Your event favorites and preferences</li>
                      <li>All linked accounts</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <Button
              onClick={() => setShowDeleteDialog(true)}
              variant="outline"
              className="gap-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* GDPR Info */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
              Your Privacy Rights
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Under GDPR and other privacy laws, you have the right to:
            </p>
            <ul className="text-sm text-slate-600 dark:text-slate-400 space-y-1 ml-4">
              <li>• Access your personal data</li>
              <li>• Rectify inaccurate data</li>
              <li>• Request data deletion</li>
              <li>• Export your data</li>
              <li>• Object to processing</li>
              <li>• Lodge a complaint with authorities</li>
            </ul>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              For questions about your privacy rights, contact{" "}
              <a href="mailto:privacy@imaginears.club" className="text-blue-600 dark:text-blue-400 hover:underline">
                privacy@imaginears.club
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Account?"
        description="This action cannot be undone. All your data will be permanently deleted."
        confirmText="Delete Account"
        variant="danger"
        onConfirm={handleDeleteAccount}
        isLoading={isDeleting}
      >
        <div className="space-y-4 py-4">
          <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-3 rounded-r-lg">
            <p className="text-sm text-red-900 dark:text-red-100">
              <strong>This is permanent!</strong> Once deleted, your account cannot be recovered.
            </p>
          </div>

          {hasPassword && (
            <div className="space-y-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                disabled={isDeleting}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="delete-confirm">Type "DELETE MY ACCOUNT" to confirm</Label>
            <Input
              id="delete-confirm"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE MY ACCOUNT"
              disabled={isDeleting}
            />
          </div>
        </div>
      </ConfirmDialog>
    </div>
  );
}

