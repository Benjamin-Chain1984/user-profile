import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface HydrationInfographicProps {
  percentOfTarget: number;
  isRestricted: boolean;
  targetOrCap: number;
  todayIntake: number;
}

export const HydrationInfographic: React.FC<HydrationInfographicProps> = ({
  percentOfTarget,
  isRestricted,
  targetOrCap,
  todayIntake
}) => {
  // Clamp fill percentage
  const fillPercent = Math.min(Math.max(percentOfTarget, 0), 120);
  
  // Determine fill color based on percentage
  const getFillColor = () => {
    if (isRestricted && fillPercent > 100) return '#ef4444'; // Red for exceeded restriction
    if (fillPercent >= 75) return '#22c55e'; // Green
    if (fillPercent >= 50) return '#eab308'; // Yellow
    return '#ef4444'; // Red for low
  };
  
  const fillColor = getFillColor();
  const bubbleCount = Math.floor(fillPercent / 10);
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Hydration Level</span>
          {isRestricted && (
            <span className="text-xs font-normal bg-amber-100 text-amber-800 px-2 py-1 rounded">
              Restricted
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg 
            viewBox="0 0 100 160" 
            className="w-32 h-48"
            aria-label={`Hydration level: ${Math.min(percentOfTarget, 100)}%`}
          >
            {/* Body silhouette */}
            <defs>
              <clipPath id="bodyClip">
                {/* Head */}
                <circle cx="50" cy="20" r="15" />
                {/* Neck */}
                <rect x="45" y="35" width="10" height="8" />
                {/* Torso */}
                <ellipse cx="50" cy="70" rx="25" ry="30" />
                {/* Arms */}
                <ellipse cx="20" cy="65" rx="8" ry="25" />
                <ellipse cx="80" cy="65" rx="8" ry="25" />
                {/* Legs */}
                <ellipse cx="38" cy="125" rx="10" ry="30" />
                <ellipse cx="62" cy="125" rx="10" ry="30" />
              </clipPath>
              
              {/* Water gradient */}
              <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.9" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>
            
            {/* Background body */}
            <g clipPath="url(#bodyClip)">
              <rect x="0" y="0" width="100" height="160" fill="#e5e7eb" />
              
              {/* Water fill */}
              <rect 
                x="0" 
                y={160 - (Math.min(fillPercent, 100) / 100) * 160}
                width="100" 
                height={(Math.min(fillPercent, 100) / 100) * 160}
                fill="url(#waterGradient)"
                className="transition-all duration-500"
              />
              
              {/* Bubbles */}
              {Array.from({ length: bubbleCount }).map((_, i) => (
                <circle
                  key={i}
                  cx={25 + Math.random() * 50}
                  cy={160 - (Math.min(fillPercent, 100) / 100) * 160 + 10 + Math.random() * ((Math.min(fillPercent, 100) / 100) * 150)}
                  r={2 + Math.random() * 3}
                  fill="white"
                  opacity={0.4 + Math.random() * 0.3}
                  className="animate-pulse"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </g>
            
            {/* Body outline */}
            <circle cx="50" cy="20" r="15" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <rect x="45" y="35" width="10" height="8" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="50" cy="70" rx="25" ry="30" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="20" cy="65" rx="8" ry="25" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="80" cy="65" rx="8" ry="25" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="38" cy="125" rx="10" ry="30" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="62" cy="125" rx="10" ry="30" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
          </svg>
        </div>
        
        {/* Stats below graphic */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-3xl font-bold" style={{ color: fillColor }}>
            {Math.min(percentOfTarget, 100)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {todayIntake}ml of {targetOrCap}ml {isRestricted ? 'limit' : 'target'}
          </p>
        </div>
        
        {/* Legend */}
        <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>≥75%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span>50-74%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>&lt;50%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
