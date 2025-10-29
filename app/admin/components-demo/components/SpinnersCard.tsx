/* eslint-disable no-unused-vars */
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner, Separator } from "@/components/common";

interface SpinnersCardProps {
  loading: boolean;
  setLoading: (value: boolean) => void;
}

export function SpinnersCard({ loading, setLoading }: SpinnersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Spinners</CardTitle>
        <CardDescription>Loading indicators in various sizes</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-6">
        <div className="text-center space-y-2">
          <Spinner size="sm" />
          <div className="text-xs text-slate-500">Small</div>
        </div>
        <div className="text-center space-y-2">
          <Spinner size="md" />
          <div className="text-xs text-slate-500">Medium</div>
        </div>
        <div className="text-center space-y-2">
          <Spinner size="lg" />
          <div className="text-xs text-slate-500">Large</div>
        </div>
        <Separator orientation="vertical" className="h-16" />
        <button
          className="btn btn-primary flex items-center gap-2"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 2000);
          }}
        >
          {loading && <Spinner size="sm" variant="current" />}
          {loading ? "Loading..." : "Click me"}
        </button>
      </CardContent>
    </Card>
  );
}

