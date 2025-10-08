import React, { useState } from 'react';

export interface DonutChartData {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  width?: number;
  height?: number;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, width = 80, height = 80 }) => {
  const [hoveredSegment, setHoveredSegment] = useState<DonutChartData | null>(null);
  
  const radius = Math.min(width, height) / 2;
  const strokeWidth = radius * 0.35;
  const innerRadius = radius - strokeWidth;
  const circumference = 2 * Math.PI * innerRadius;
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  let accumulatedPercent = 0;

  // Handle case with no issues
  if (totalValue === 0) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="none"
          stroke="#e5e7eb" // slate-200
          strokeWidth={strokeWidth}
          className="dark:stroke-slate-700"
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="text-2xl font-bold fill-current text-slate-700 dark:text-slate-200"
        >
          0
        </text>
      </svg>
    );
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="-rotate-90">
      <circle
        cx={radius}
        cy={radius}
        r={innerRadius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
        className="dark:stroke-slate-700"
      />
      {/* Data Segments */}
      {data.map((item) => {
        if (item.value === 0) return null;
        
        const isHovered = hoveredSegment?.name === item.name;
        const percent = (item.value / totalValue) * 100;
        const offset = (accumulatedPercent / 100) * circumference;
        const dasharray = `${(percent / 100) * circumference} ${circumference}`;
        accumulatedPercent += percent;

        return (
          <circle
            key={item.name}
            cx={radius}
            cy={radius}
            r={innerRadius}
            fill="none"
            stroke={item.color}
            strokeWidth={isHovered ? strokeWidth * 1.2 : strokeWidth}
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            onMouseEnter={() => setHoveredSegment(item)}
            onMouseLeave={() => setHoveredSegment(null)}
            className="cursor-pointer transition-all duration-200"
          />
        );
      })}

      {/* Central Text */}
      <g transform={`rotate(90 ${radius} ${radius})`}>
        {hoveredSegment ? (
          <>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              dy="-0.2em"
              className="text-2xl font-bold"
              style={{ fill: hoveredSegment.color }}
            >
              {hoveredSegment.value}
            </text>
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="central"
              dy="1em"
              className="text-[10px] font-semibold fill-current text-slate-500 dark:text-slate-400"
            >
              {hoveredSegment.name}
            </text>
          </>
        ) : (
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-2xl font-bold fill-current text-slate-700 dark:text-slate-200"
          >
            {totalValue}
          </text>
        )}
      </g>
    </svg>
  );
};

export default DonutChart;