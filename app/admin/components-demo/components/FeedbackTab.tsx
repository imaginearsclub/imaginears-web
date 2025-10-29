/* eslint-disable no-unused-vars */
import { ProgressCard } from "./ProgressCard";
import { SpinnersCard } from "./SpinnersCard";
import { AvatarsCard } from "./AvatarsCard";
import { SkeletonCard } from "./SkeletonCard";
import { EmptyStateCard } from "./EmptyStateCard";

interface FeedbackTabProps {
  progress: number;
  setProgress: (value: number | ((prev: number) => number)) => void;
  loading: boolean;
  setLoading: (value: boolean) => void;
}

export function FeedbackTab({ progress, setProgress, loading, setLoading }: FeedbackTabProps) {
  return (
    <div className="space-y-6">
      <ProgressCard progress={progress} setProgress={setProgress} />
      <SpinnersCard loading={loading} setLoading={setLoading} />
      <AvatarsCard />
      <SkeletonCard />
      <EmptyStateCard />
    </div>
  );
}

