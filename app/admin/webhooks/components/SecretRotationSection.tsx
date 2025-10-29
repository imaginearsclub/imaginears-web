import { memo } from 'react';
import { Button } from '@/components/common';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SecretRotationSectionProps {
  onRotateSecret: () => void;
  submitting: boolean;
  rotatingSecret: boolean;
}

export const SecretRotationSection = memo(function SecretRotationSection({
  onRotateSecret,
  submitting,
  rotatingSecret,
}: SecretRotationSectionProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Webhook Secret
      </label>
      <Button
        variant="outline"
        onClick={onRotateSecret}
        disabled={submitting || rotatingSecret}
        className="w-full"
      >
        <RotateCw className={cn("w-4 h-4 mr-2", rotatingSecret && "animate-spin")} />
        {rotatingSecret ? "Rotating..." : "Rotate Secret"}
      </Button>
      <p className="text-xs text-slate-500 mt-1">
        Generate a new secret and invalidate the old one
      </p>
    </div>
  );
});

