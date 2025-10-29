import { memo } from "react";
import { StaffTableRow } from "./StaffTableRow";

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

interface StaffTableProps {
  staff: StaffMember[];
  currentUserId: string;
  isPending: boolean;
  searchQuery: string;
  filterRole: string;
  /* eslint-disable-next-line no-unused-vars */
  onEdit: (member: StaffMember) => void;
  /* eslint-disable-next-line no-unused-vars */
  onDelete: (id: string) => void;
}

export const StaffTable = memo(function StaffTable({
  staff,
  currentUserId,
  isPending,
  searchQuery,
  filterRole,
  onEdit,
  onDelete,
}: StaffTableProps) {
  return (
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
            {staff.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  {searchQuery || filterRole !== "ALL" 
                    ? "No staff members match your filters"
                    : "No staff members found"}
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <StaffTableRow
                  key={member.id}
                  member={member}
                  currentUserId={currentUserId}
                  isPending={isPending}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

