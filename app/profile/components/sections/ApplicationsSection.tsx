"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/common";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Application {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  mcUsername: string;
  role: string;
  ageRange: string;
  notes: string | null;
  updatedBy: { name: string | null } | null;
  // Role-specific fields
  priorServers: string | null;
  visitedDetails: string | null;
  devPortfolioUrl: string | null;
  imgPortfolioUrl: string | null;
  grStory: string | null;
}

interface ApplicationsSectionProps {
  applications: Application[];
}

const statusConfig = {
  New: {
    label: "New",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  InReview: {
    label: "In Review",
    icon: AlertCircle,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  Approved: {
    label: "Approved",
    icon: CheckCircle,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-900/20",
    borderColor: "border-green-200 dark:border-green-800",
  },
  Rejected: {
    label: "Rejected",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-900/20",
    borderColor: "border-red-200 dark:border-red-800",
  },
};

export function ApplicationsSection({ applications }: ApplicationsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Application History
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          View your server application submissions and their current status
        </p>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                No Applications Yet
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                You haven't submitted any applications to join the server.
              </p>
              <a
                href="/apply"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <FileText className="w-4 h-4" />
                Apply Now
              </a>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const config = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.New;
            const StatusIcon = config.icon;

            return (
              <Card key={app.id} className={cn("border-l-4", config.borderColor)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <CardTitle className="text-base">
                        {app.role} Application - <span className="font-mono">{app.mcUsername}</span>
                      </CardTitle>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      config.bgColor,
                      config.color
                    )}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Application Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Submitted:</span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {app.status !== 'New' && (
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Last Updated:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {new Date(app.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600 dark:text-slate-400">Age Range:</span>
                      <span className="ml-2 font-medium text-slate-900 dark:text-white">
                        {app.ageRange}
                      </span>
                    </div>
                    {app.updatedBy && (
                      <div>
                        <span className="text-slate-600 dark:text-slate-400">Reviewed by:</span>
                        <span className="ml-2 font-medium text-slate-900 dark:text-white">
                          {app.updatedBy.name || 'Staff'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Staff Notes */}
                  {app.notes && (
                    <div className={cn(
                      "p-3 rounded-lg border",
                      config.bgColor,
                      config.borderColor
                    )}>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white mb-1">
                        Staff Notes:
                      </div>
                      <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {app.notes}
                      </div>
                    </div>
                  )}

                  {/* Application Responses (Collapsible) */}
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 list-none flex items-center gap-2">
                      <span className="transition-transform group-open:rotate-90">▶</span>
                      View Full Application
                    </summary>
                    <div className="mt-3 space-y-3 pl-6">
                      {app.priorServers && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Prior Server Experience:
                          </div>
                          <div className="text-sm text-slate-900 dark:text-white">
                            {app.priorServers}
                          </div>
                        </div>
                      )}
                      {app.visitedDetails && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Disney Visit Details:
                          </div>
                          <div className="text-sm text-slate-900 dark:text-white">
                            {app.visitedDetails}
                          </div>
                        </div>
                      )}
                      {app.devPortfolioUrl && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Developer Portfolio:
                          </div>
                          <a 
                            href={app.devPortfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {app.devPortfolioUrl}
                          </a>
                        </div>
                      )}
                      {app.imgPortfolioUrl && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Imaginear Portfolio:
                          </div>
                          <a 
                            href={app.imgPortfolioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {app.imgPortfolioUrl}
                          </a>
                        </div>
                      )}
                      {app.grStory && (
                        <div>
                          <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Guest Relations Story:
                          </div>
                          <div className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">
                            {app.grStory}
                          </div>
                        </div>
                      )}
                    </div>
                  </details>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

