"use client";

interface Props {
  values: number[];
  color?: string;
  min?: number;
  max?: number;
  height?: number;
  gradient?: boolean;
}

export function TrendSpark({
  values,
  color = "#67e8f9",
  min = 0,
  max = 100,
  height = 40,
  gradient = true,
}: Props) {
  if (values.length === 0) return null;
  const w = 240;
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * (w - 4) + 2;
      const y = height - ((v - min) / range) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");
  const areaPoints = `2,${height} ${points} ${w - 2},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full">
      {gradient && (
        <defs>
          <linearGradient id={`g-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {gradient && <polygon points={areaPoints} fill={`url(#g-${color})`} />}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
