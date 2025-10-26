import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NotificationPreferencesForm } from "./components/NotificationPreferencesForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common";
import { Bell } from "lucide-react";

export const metadata = {
  title: "Notification Preferences",
  description: "Manage your notification settings and preferences",
};

export default async function NotificationPreferencesPage() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Notification Preferences
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
            Customize how and when you receive notifications
          </p>
        </div>
      </div>

      {/* Preferences Form */}
      <Card accent="primary" variant="elevated">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Control which notifications you receive and how they're delivered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferencesForm />
        </CardContent>
      </Card>
    </div>
  );
}

