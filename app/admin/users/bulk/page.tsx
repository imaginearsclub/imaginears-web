import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { BulkUserManagementClient } from "./components/BulkUserManagementClient";

export const dynamic = "force-dynamic";

export default async function BulkUserManagementPage() {
  // Require bulk operations permission
  const session = await requirePermission("users:bulk_operations");
  if (!session) {
    redirect("/login");
  }

  // Get user statistics for the dashboard
  const totalUsers = await prisma.user.count();
  const usersByRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  const roleStats = usersByRole.reduce((acc, item) => {
    acc[item.role] = item._count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Bulk User Management
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage multiple users efficiently with bulk operations
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800">
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
            {totalUsers}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Total Users
          </div>
        </div>
        
        {Object.entries(roleStats).slice(0, 3).map(([role, count]) => (
          <div key={role} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700">
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {count}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              {role}s
            </div>
          </div>
        ))}
      </div>

      {/* Main Component */}
      <BulkUserManagementClient />
    </div>
  );
}

