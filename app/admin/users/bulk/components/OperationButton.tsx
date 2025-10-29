import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';

interface OperationButtonProps {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
  color: 'red' | 'green' | 'blue' | 'orange' | 'purple';
}

const colorClasses = {
  red: 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  green: 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  blue: 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  orange: 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
  purple: 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
};

export const OperationButton = memo(function OperationButton({
  icon: Icon,
  label,
  selected,
  onClick,
  color,
}: OperationButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        selected
          ? colorClasses[color]
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <Icon className="w-6 h-6 mx-auto mb-2" />
      <div className="text-sm font-medium text-center">{label}</div>
    </button>
  );
});

