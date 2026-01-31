import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

interface HydrationInfographicProps {
  percentOfTarget: number;
  isRestricted: boolean;
  targetOrCap: number;
  todayIntake: number;
}

// Generate bubble positions based on fill level
function generateBubbles(fillPercent: number): Array<{ cx: number; cy: number; r: number; delay: number }> {
  if (fillPercent < 5) return [];
  
  const bubbleCount = Math.min(Math.floor(fillPercent / 10), 8);
  const bubbles: Array<{ cx: number; cy: number; r: number; delay: number }> = [];
  
  for (let i = 0; i < bubbleCount; i++) {
    // Distribute bubbles within the filled area of the body
    const fillHeight = (fillPercent / 100) * 140;
    const minY = 180 - fillHeight + 10;
    const maxY = 175;
    
    bubbles.push({
      cx: 35 + Math.random() * 30, // Random x within body width
      cy: minY + Math.random() * (maxY - minY),
      r: 2 + Math.random() * 3,
      delay: i * 0.2
    });
  }
  
  return bubbles;
}

export const HydrationInfographic: React.FC<HydrationInfographicProps> = ({
  percentOfTarget,
  isRestricted,
  targetOrCap,
  todayIntake
}) => {
  // Clamp fill percentage
  const fillPercent = Math.min(Math.max(percentOfTarget, 0), 100);
  
  // Memoize bubbles so they don't regenerate on every render
  const bubbles = useMemo(() => generateBubbles(fillPercent), [fillPercent]);
  
  // Calculate fill height - body fills from bottom up
  const fillHeight = (fillPercent / 100) * 140; // Max fill height of body area
  const fillY = 180 - fillHeight; // Start position from bottom
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Droplets className="h-5 w-5 text-primary" />
          <span>Hydration Level</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg 
            viewBox="0 0 100 200" 
            className="w-32 h-48"
            aria-label={`Hydration level: ${fillPercent}%`}
          >
            <defs>
              {/* Clip path for human body silhouette */}
              <clipPath id="bodyClip">
                {/* Head */}
                <circle cx="50" cy="22" r="16" />
                {/* Neck */}
                <rect x="44" y="36" width="12" height="8" />
                {/* Torso */}
                <path d="M30 44 Q28 70 30 100 L30 130 Q30 140 35 145 L35 180 L42 180 L42 145 L50 145 L58 145 L58 180 L65 180 L65 145 Q70 140 70 130 L70 100 Q72 70 70 44 Z" />
                {/* Arms */}
                <path d="M30 48 Q20 55 15 80 Q13 90 18 92 Q23 90 28 75 L30 60" />
                <path d="M70 48 Q80 55 85 80 Q87 90 82 92 Q77 90 72 75 L70 60" />
              </clipPath>
              
              {/* Water gradient */}
              <linearGradient id="bodyWaterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="hsl(200, 80%, 50%)" stopOpacity="0.85" />
                <stop offset="40%" stopColor="hsl(200, 75%, 55%)" stopOpacity="0.75" />
                <stop offset="100%" stopColor="hsl(200, 70%, 65%)" stopOpacity="0.6" />
              </linearGradient>
              
              {/* Body outline gradient */}
              <linearGradient id="bodyOutlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(210, 20%, 70%)" />
                <stop offset="100%" stopColor="hsl(210, 15%, 60%)" />
              </linearGradient>
            </defs>
            
            {/* Body silhouette background */}
            <g opacity="0.3">
              {/* Head */}
              <circle cx="50" cy="22" r="16" fill="hsl(210, 15%, 85%)" stroke="url(#bodyOutlineGradient)" strokeWidth="1.5" />
              {/* Neck */}
              <rect x="44" y="36" width="12" height="8" fill="hsl(210, 15%, 85%)" />
              {/* Torso and legs */}
              <path 
                d="M30 44 Q28 70 30 100 L30 130 Q30 140 35 145 L35 180 L42 180 L42 145 L50 145 L58 145 L58 180 L65 180 L65 145 Q70 140 70 130 L70 100 Q72 70 70 44 Z" 
                fill="hsl(210, 15%, 85%)" 
                stroke="url(#bodyOutlineGradient)" 
                strokeWidth="1.5"
              />
              {/* Left arm */}
              <path 
                d="M30 48 Q20 55 15 80 Q13 90 18 92 Q23 90 28 75 L30 60" 
                fill="hsl(210, 15%, 85%)" 
                stroke="url(#bodyOutlineGradient)" 
                strokeWidth="1.5"
              />
              {/* Right arm */}
              <path 
                d="M70 48 Q80 55 85 80 Q87 90 82 92 Q77 90 72 75 L70 60" 
                fill="hsl(210, 15%, 85%)" 
                stroke="url(#bodyOutlineGradient)" 
                strokeWidth="1.5"
              />
            </g>
            
            {/* Water fill clipped to body shape */}
            <g clipPath="url(#bodyClip)">
              {/* Water fill rectangle */}
              <rect 
                x="0" 
                y={fillY}
                width="100" 
                height={fillHeight + 10}
                fill="url(#bodyWaterGradient)"
                className="transition-all duration-700 ease-out"
              />
              
              {/* Wave effect at water surface */}
              {fillPercent > 5 && (
                <ellipse 
                  cx="50" 
                  cy={fillY}
                  rx="40"
                  ry="4"
                  fill="hsl(200, 70%, 70%)"
                  opacity="0.5"
                  className="transition-all duration-700 ease-out"
                />
              )}
              
              {/* Animated bubbles */}
              {bubbles.map((bubble, index) => (
                <circle 
                  key={index}
                  cx={bubble.cx} 
                  cy={bubble.cy} 
                  r={bubble.r} 
                  fill="white" 
                  opacity="0.5"
                  className="animate-pulse"
                  style={{ animationDelay: `${bubble.delay}s` }}
                />
              ))}
            </g>
            
            {/* Body outline overlay for definition */}
            <g fill="none" stroke="hsl(210, 20%, 65%)" strokeWidth="1" opacity="0.6">
              <circle cx="50" cy="22" r="16" />
              <path d="M30 44 Q28 70 30 100 L30 130 Q30 140 35 145 L35 180 L42 180 L42 145 L50 145 L58 145 L58 180 L65 180 L65 145 Q70 140 70 130 L70 100 Q72 70 70 44 Z" />
              <path d="M30 48 Q20 55 15 80 Q13 90 18 92 Q23 90 28 75 L30 60" />
              <path d="M70 48 Q80 55 85 80 Q87 90 82 92 Q77 90 72 75 L70 60" />
            </g>
          </svg>
        </div>
        
        {/* Stats below graphic */}
        <div className="text-center mt-4 space-y-1">
          <p className="text-3xl font-bold text-primary">
            {fillPercent}%
          </p>
          <p className="text-sm text-muted-foreground">
            {todayIntake}ml of {targetOrCap}ml {isRestricted ? 'limit' : 'target'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
