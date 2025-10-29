import { memo } from "react";

const ROLES = [
  { value: "STAFF", label: "Staff", description: "Basic staff member with limited permissions" },
  { value: "MODERATOR", label: "Moderator", description: "Can manage players and moderate content" },
  { value: "ADMIN", label: "Admin", description: "Full administrative access" },
  { value: "OWNER", label: "Owner", description: "Complete system control" },
] as const;

export const RoleDescriptions = memo(function RoleDescriptions() {
  return (
    <div className="rounded-lg border-2 border-slate-300 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900/50">
      <h4 className="font-semibold text-sm mb-3 text-slate-900 dark:text-white">Role Permissions:</h4>
      <div className="space-y-2">
        {ROLES.map((role) => (
          <div key={role.value} className="text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">{role.label}:</span>{" "}
            <span className="text-slate-600 dark:text-slate-400">{role.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
});

