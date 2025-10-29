import { memo } from "react";
import { Input } from "@/components/common";
import { cn } from "@/lib/utils";

interface StaffFiltersProps {
  searchQuery: string;
  /* eslint-disable-next-line no-unused-vars */
  onSearchChange: (value: string) => void;
  filterRole: string;
  /* eslint-disable-next-line no-unused-vars */
  onRoleChange: (value: string) => void;
}

export const StaffFilters = memo(function StaffFilters({
  searchQuery,
  onSearchChange,
  filterRole,
  onRoleChange,
}: StaffFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <Input
          type="text"
          placeholder="Search by name, email, or Minecraft username..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="w-full sm:w-48">
        <select
          value={filterRole}
          onChange={(e) => onRoleChange(e.target.value)}
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
  );
});

