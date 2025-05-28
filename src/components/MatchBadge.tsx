import React from 'react';

interface MatchBreakdown {
  fabric: number;
  fit: number;
  construction: number;
  care: number;
  total: number;
}

interface MatchBadgeProps {
  score: number;
  label: string;
  weight?: number;
  showTooltip?: boolean;
  breakdown?: MatchBreakdown;
}

const MatchBadge: React.FC<MatchBadgeProps> = ({
  score,
  label,
  weight = 1,
  showTooltip = false,
  breakdown,
}) => {
  const percentage = Math.round(score * 100);
  const getColorClass = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const tooltipContent = breakdown ? (
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-2 bg-gray-900 text-white text-sm rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity w-48 z-10">
      <div className="text-center mb-1 font-medium">Match Breakdown</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Fabric:</span>
          <span>{Math.round(breakdown.fabric * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Fit:</span>
          <span>{Math.round(breakdown.fit * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Construction:</span>
          <span>{Math.round(breakdown.construction * 100)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Care:</span>
          <span>{Math.round(breakdown.care * 100)}%</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative group inline-block">
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getColorClass(score)}`}>
        <span>{percentage}% {label}</span>
        {weight !== 1 && <span className="ml-1 text-xs opacity-75">({Math.round(weight * 100)}%)</span>}
      </div>
      {showTooltip && tooltipContent}
    </div>
  );
};

export default MatchBadge; 