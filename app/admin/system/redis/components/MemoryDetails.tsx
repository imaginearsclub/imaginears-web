import { memo } from "react";
import { Card } from "@/components/common";
import { HardDrive } from "lucide-react";

interface MemoryDetailsProps {
  memory: {
    usedMemoryHuman: string;
    usedMemoryPeakHuman: string;
    memoryFragmentationRatio: number;
    maxMemoryHuman: string;
    maxMemoryPolicy: string;
    totalSystemMemoryHuman: string;
  };
}

export const MemoryDetails = memo(function MemoryDetails({ memory }: MemoryDetailsProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
        <HardDrive className="w-5 h-5" />
        Memory Statistics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Current Usage</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.usedMemoryHuman}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Peak Usage</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.usedMemoryPeakHuman}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Fragmentation Ratio</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.memoryFragmentationRatio.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Max Memory</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.maxMemoryHuman || "Unlimited"}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Eviction Policy</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.maxMemoryPolicy}
          </p>
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Total System</p>
          <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">
            {memory.totalSystemMemoryHuman}
          </p>
        </div>
      </div>
    </Card>
  );
});

