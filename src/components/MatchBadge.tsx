'use client';

interface MatchBadgeProps {
  label: string;
  score: number;
  weight: string;
  large?: boolean;
}

export default function MatchBadge({ label, score, weight, large = false }: MatchBadgeProps) {
  const getColorClass = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 70) return 'bg-blue-100 text-blue-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const baseClasses = `rounded-lg p-4 flex items-center justify-between ${getColorClass(score)}`;
  const textClasses = large ? 'text-lg' : 'text-sm';

  return (
    <div className={baseClasses}>
      <div>
        <p className={`font-medium ${textClasses}`}>{label}</p>
        <p className="text-xs opacity-75">Weight: {weight}</p>
      </div>
      <div className={`font-bold ${large ? 'text-2xl' : 'text-lg'}`}>
        {score.toFixed(1)}%
      </div>
    </div>
  );
} 