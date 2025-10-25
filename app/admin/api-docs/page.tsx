import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/common";
import { BookOpen } from "lucide-react";
import { ApiDocsContent } from "./components/ApiDocsContent";

export const dynamic = "force-dynamic";

export default async function ApiDocsPage() {
  const session = await getServerSession();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Only allow admins and staff
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  const isStaff = ["OWNER", "ADMIN", "MODERATOR", "STAFF"].includes(user?.role || "");
  
  if (!isStaff) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              API Documentation
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Interactive API playground and documentation
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Base URL</div>
          <code className="text-sm font-mono text-slate-900 dark:text-white">
            https://imaginears.club/api
          </code>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Authentication</div>
          <div className="text-sm text-slate-900 dark:text-white">
            API Key or Session Cookie
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Rate Limit</div>
          <div className="text-sm text-slate-900 dark:text-white">
            100 requests/minute (configurable)
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <ApiDocsContent />
    </div>
  );
}

