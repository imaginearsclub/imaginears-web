import { memo } from "react";
import { Button, Badge } from "@/components/common";
import { User, Mail, Shield, Activity, Calendar, Edit2, Trash2 } from "lucide-react";
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

interface StaffTableRowProps {
  member: StaffMember;
  currentUserId: string;
  isPending: boolean;
  /* eslint-disable-next-line no-unused-vars */
  onEdit: (member: StaffMember) => void;
  /* eslint-disable-next-line no-unused-vars */
  onDelete: (id: string) => void;
}

const ROLE_COLORS = {
  OWNER: "danger",
  ADMIN: "primary",
  MODERATOR: "info",
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

export const StaffTableRow = memo(function StaffTableRow({
  member,
  currentUserId,
  isPending,
  onEdit,
  onDelete,
}: StaffTableRowProps) {
  return (
    <tr className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          {member.image ? (
            <img src={member.image} alt={member.name || ""} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-900 dark:text-white">
              {member.name || "Unnamed"}
              {member.id === currentUserId && <span className="ml-2 text-xs text-slate-500">(You)</span>}
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

      <td className="px-4 py-4">
        {member.minecraftName ? (
          <code className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sm font-mono text-slate-900 dark:text-white">
            {member.minecraftName}
          </code>
        ) : (
          <span className="text-sm text-slate-400 dark:text-slate-500 italic">Not linked</span>
        )}
      </td>

      <td className="px-4 py-4">
        <Badge variant={ROLE_COLORS[member.role as keyof typeof ROLE_COLORS] || "default"} size="sm">
          <Shield className="w-3 h-3 mr-1" />
          {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
        </Badge>
      </td>

      <td className="px-4 py-4">
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Activity className="w-3 h-3" />
            {member._count.sessions > 0 ? (
              <span className="text-green-600 dark:text-green-400 font-medium">Active</span>
            ) : (
              <span>Inactive</span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {member._count.createdEvents} events • {member._count.createdApplications} apps
          </div>
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="w-3 h-3" />
          {format(new Date(member.createdAt), "MMM d, yyyy")}
        </div>
      </td>

      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(member)} disabled={isPending}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(member.id)}
            disabled={isPending || member.id === currentUserId}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
});

