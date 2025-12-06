interface ConfidenceBadgeProps {
  score?: number;
  showPercentage?: boolean;
}

export default function ConfidenceBadge({ score, showPercentage = true }: ConfidenceBadgeProps) {
  if (!score) return null;

  const percentage = (score * 100).toFixed(0);
  const isHigh = score >= 0.8;
  const isMedium = score >= 0.5 && score < 0.8;
  const isLow = score < 0.5;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isHigh
          ? 'bg-green-100 text-green-800 border border-green-200'
          : isMedium
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      {isHigh && '✓ High'}
      {isMedium && '⚠ Medium'}
      {isLow && '✗ Low'}
      {showPercentage && ` (${percentage}%)`}
    </span>
  );
}
