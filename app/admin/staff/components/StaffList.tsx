"use client";

import { useState, useTransition } from "react";
import { Button, Input, Label, Badge } from "@/components/common";
import { AlertCircle, CheckCircle, Edit2, Trash2, Loader2, User, Mail, Calendar, Shield, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StaffMember {
  id: string;
  name: string | null;
  email: string | null;
  minecraftName: string | null;
  role: string;
  image: string | null;
  emailVerified: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    sessions: number;
    createdEvents: number;
    createdApplications: number;
  };
}

interface StaffListProps {
  staff: StaffMember[];
  currentUserId: string;
  updateAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
  deleteAction: (formData: FormData) => Promise<{ success: boolean; message: string }>;
}

const ROLE_COLORS = {
  OWNER: "destructive",
  ADMIN: "primary",
  MODERATOR: "secondary",
  STAFF: "default",
  USER: "default",
} as const;

const ROLE_LABELS = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MODERATOR: "Moderator",
  STAFF: "Staff",
  USER: "User",
} as const;

export function StaffList({ staff, currentUserId, updateAction, deleteAction }: StaffListProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingMinecraftName, setEditingMinecraftName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("ALL");

  const filteredStaff = staff.filter(member => {
    const matchesSearch = !searchQuery || 
      member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.minecraftName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "ALL" || member.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const handleUpdate = (staffId: string, newMinecraftName: string) => {
    setResult(null);
    const formData = new FormData();
    formData.append("userId", staffId);
    formData.append("minecraftName", newMinecraftName);

    startTransition(async () => {
      try {
        const res = await updateAction(formData);
        setResult(res);
        
        if (res.success) {
          setSelectedStaff(null);
          setTimeout(() => setResult(null), 3000);
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to update staff member",
        });
      }
    });
  };

  const handleDelete = (staffId: string) => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      return;
    }

    setResult(null);
    const formData = new FormData();
    formData.append("userId", staffId);

    startTransition(async () => {
      try {
        const res = await deleteAction(formData);
        setResult(res);
        
        if (res.success) {
          setTimeout(() => setResult(null), 3000);
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || "Failed to delete staff member",
        });
      }
    });
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedStaff(member);
    setEditingMinecraftName(member.minecraftName || "");
    setResult(null);
  };

  const closeEditDialog = () => {
    setSelectedStaff(null);
    setEditingMinecraftName("");
  };

  return (
    <div className="space-y-4">
      {/* Result Message */}
      {result && (
        <div
          className={cn(
            "flex items-start gap-3 p-4 rounded-lg border-2 animate-in fade-in slide-in-from-top-2",
            result.success
              ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}
        >
          {result.success ? (
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          )}
          <p
            className={cn(
              "text-sm font-medium",
              result.success
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            )}
          >
            {result.message}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by name, email, or Minecraft username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className={cn(
              "w-full rounded-xl border-2 px-4 py-2.5 outline-none transition-all duration-200",
              "bg-white dark:bg-slate-900",
              "border-slate-300 dark:border-slate-700",
              "text-slate-700 dark:text-slate-300",
              "hover:border-slate-400 dark:hover:border-slate-600",
              "focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="ALL">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MODERATOR">Moderator</option>
            <option value="STAFF">Staff</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border-2 border-slate-300 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Staff Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Minecraft
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    {searchQuery || filterRole !== "ALL" 
                      ? "No staff members match your filters"
                      : "No staff members found"}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    {/* Staff Member */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {member.image ? (
                          <img
                            src={member.image}
                            alt={member.name || ""}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {member.name || "Unnamed"}
                            {member.id === currentUserId && (
                              <span className="ml-2 text-xs text-slate-500">(You)</span>
                            )}
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {member.email}
                          </div>
                          {member.emailVerified && (
                            <Badge variant="success" size="sm" className="mt-1">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Minecraft */}
                    <td className="px-4 py-4">
                      {member.minecraftName ? (
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white">
                            {member.minecraftName}
                          </code>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 dark:text-slate-500 italic">
                          Not linked
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-4">
                      <Badge 
                        variant={ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || "default"}
                        size="sm"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
                      </Badge>
                    </td>

                    {/* Activity */}
                    <td className="px-4 py-4">
                      <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Activity className="w-3 h-3" />
                          {member._count.sessions > 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              Active
                            </span>
                          ) : (
                            <span>Inactive</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          {member._count.createdEvents} events • {member._count.createdApplications} apps
                        </div>
                      </div>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(member.createdAt), "MMM d, yyyy")}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(member)}
                          disabled={isPending}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          disabled={isPending || member.id === currentUserId}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Dialog */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-300 dark:border-slate-700">
            <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
              Edit Staff Member
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Name</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedStaff.name}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Email</p>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedStaff.email}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editMinecraftName">
                  Minecraft Username
                </Label>
                <Input
                  id="editMinecraftName"
                  type="text"
                  placeholder="Steve123"
                  value={editingMinecraftName}
                  onChange={(e) => setEditingMinecraftName(e.target.value)}
                  disabled={isPending}
                  pattern="[a-zA-Z0-9_]{3,16}"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  3-16 characters, alphanumeric and underscores only
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={closeEditDialog}
                disabled={isPending}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleUpdate(selectedStaff.id, editingMinecraftName)}
                disabled={isPending}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

