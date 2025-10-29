/* eslint-disable no-unused-vars */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Progress } from "@/components/common";

interface ProgressCardProps {
  progress: number;
  setProgress: (value: number | ((prev: number) => number)) => void;
}

export function ProgressCard({ progress, setProgress }: ProgressCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Indicators</CardTitle>
        <CardDescription>Visual progress feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Default Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} showValue />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Success Progress</span>
            <span>75%</span>
          </div>
          <Progress value={75} variant="success" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Warning Progress</span>
            <span>30%</span>
          </div>
          <Progress value={30} variant="warning" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Danger Progress</span>
            <span>15%</span>
          </div>
          <Progress value={15} variant="danger" />
        </div>
        <div className="flex gap-2">
          <button className="btn btn-muted btn-sm" onClick={() => setProgress((p) => Math.max(0, p - 10))}>
            Decrease
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setProgress((p) => Math.min(100, p + 10))}>
            Increase
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

