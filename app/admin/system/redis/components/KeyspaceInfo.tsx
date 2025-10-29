import { memo } from "react";
import { Card } from "@/components/common";
import { Database } from "lucide-react";

interface Keyspace {
  db: number;
  keys: number;
  expires: number;
  avgTtl: number;
}

interface KeyspaceInfoProps {
  keyspaces: Keyspace[];
}

export const KeyspaceInfo = memo(function KeyspaceInfo({ keyspaces }: KeyspaceInfoProps) {
  if (keyspaces.length === 0) return null;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <Database className="w-5 h-5" />
        Keyspace Information
      </h2>
      <div className="space-y-3">
        {keyspaces.map((ks) => (
          <div
            key={ks.db}
            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
          >
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">Database {ks.db}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {ks.keys.toLocaleString()} keys ({ks.expires.toLocaleString()} with TTL)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600 dark:text-slate-400">Avg TTL</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {Math.floor(ks.avgTtl / 1000)}s
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
});

