import { memo } from "react";
import { Card } from "@/components/common";
import { cn } from "@/lib/utils";
import { Clock, HardDrive, Users, TrendingUp } from "lucide-react";

interface OverviewCardsProps {
  uptime: number;
  memory: {
    usedMemoryHuman: string;
    maxMemoryHuman: string;
    totalSystemMemoryHuman: string;
    usedPercentage: number;
  };
  connectedClients: number;
  blockedClients: number;
  opsPerSec: number;
  totalCommands: number;
}

export const OverviewCards = memo(function OverviewCards({
  uptime,
  memory,
  connectedClients,
  blockedClients,
  opsPerSec,
  totalCommands,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Uptime</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {Math.floor(uptime / 86400)}d {Math.floor((uptime % 86400) / 3600)}h
            </p>
          </div>
          <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Memory Usage</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {memory.usedPercentage.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {memory.usedMemoryHuman} / {memory.maxMemoryHuman || memory.totalSystemMemoryHuman}
            </p>
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            memory.usedPercentage > 90 ? "bg-red-100 dark:bg-red-900/30" :
            memory.usedPercentage > 75 ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-green-100 dark:bg-green-900/30"
          )}>
            <HardDrive className={cn(
              "w-5 h-5",
              memory.usedPercentage > 90 ? "text-red-600 dark:text-red-400" :
              memory.usedPercentage > 75 ? "text-amber-600 dark:text-amber-400" :
              "text-green-600 dark:text-green-400"
            )} />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Connections</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {connectedClients}
            </p>
            {blockedClients > 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                {blockedClients} blocked
              </p>
            )}
          </div>
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Ops/sec</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {opsPerSec.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {totalCommands.toLocaleString()} total
            </p>
          </div>
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
      </Card>
    </div>
  );
});

