import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

interface HydrationInfographicProps {
  percentOfTarget: number;
  isRestricted: boolean;
  targetOrCap: number;
  todayIntake: number;
}

// Generate rising bubble positions based on fill level
function generateBubbles(fillPercent: number): Array<{ cx: number; cy: number; r: number; delay: number; duration: number }> {
  if (fillPercent < 5) return [];
  
  const bubbleCount = Math.min(Math.floor(fillPercent / 8), 10);
  const bubbles: Array<{ cx: number; cy: number; r: number; delay: number; duration: number }> = [];
  
  for (let i = 0; i < bubbleCount; i++) {
    bubbles.push({
      cx: 35 + Math.random() * 30,
      cy: 0, // Will animate from bottom
      r: 1.5 + Math.random() * 2.5,
      delay: i * 0.3 + Math.random() * 0.5,
      duration: 2 + Math.random() * 1.5
    });
  }
  
  return bubbles;
}

// Generate light reflection spots
function generateReflections(fillPercent: number): Array<{ cx: number; cy: number; rx: number; ry: number }> {
  if (fillPercent < 15) return [];
  
  const fillHeight = (fillPercent / 100) * 140;
  const baseY = 180 - fillHeight;
  
  return [
    { cx: 42, cy: baseY + fillHeight * 0.3, rx: 3, ry: 6 },
    { cx: 58, cy: baseY + fillHeight * 0.5, rx: 2, ry: 4 },
    { cx: 48, cy: baseY + fillHeight * 0.7, rx: 1.5, ry: 3 },
  ];
}

export const HydrationInfographic: React.FC<HydrationInfographicProps> = ({
  percentOfTarget,
  isRestricted,
  targetOrCap,
  todayIntake
}) => {
  // Clamp fill percentage
  const fillPercent = Math.min(Math.max(percentOfTarget, 0), 100);
  
  // Memoize bubbles and reflections
  const bubbles = useMemo(() => generateBubbles(fillPercent), [fillPercent]);
  const reflections = useMemo(() => generateReflections(fillPercent), [fillPercent]);
  
  // Calculate fill height - body fills from bottom up
  const fillHeight = (fillPercent / 100) * 140;
  const fillY = 180 - fillHeight;
  
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
              
              {/* Enhanced water gradient with depth */}
              <linearGradient id="bodyWaterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="hsl(200, 85%, 45%)" stopOpacity="0.9" />
                <stop offset="30%" stopColor="hsl(200, 80%, 50%)" stopOpacity="0.85" />
                <stop offset="70%" stopColor="hsl(195, 75%, 55%)" stopOpacity="0.75" />
                <stop offset="100%" stopColor="hsl(190, 70%, 65%)" stopOpacity="0.6" />
              </linearGradient>
              
              {/* Surface highlight gradient */}
              <linearGradient id="surfaceHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.6" />
                <stop offset="50%" stopColor="white" stopOpacity="0.2" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
              
              {/* Light reflection gradient */}
              <radialGradient id="reflectionGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              
              {/* Body outline gradient */}
              <linearGradient id="bodyOutlineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(210, 20%, 70%)" />
                <stop offset="100%" stopColor="hsl(210, 15%, 60%)" />
              </linearGradient>
              
              {/* Wave pattern for animated surface */}
              <pattern id="wavePattern" x="0" y="0" width="20" height="6" patternUnits="userSpaceOnUse">
                <path 
                  d="M0 3 Q5 0 10 3 T20 3" 
                  fill="none" 
                  stroke="hsl(190, 80%, 70%)" 
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              </pattern>
            </defs>
            
            {/* Inline styles for animations */}
            <style>{`
              @keyframes waveMove {
                0% { transform: translateX(0); }
                100% { transform: translateX(-20px); }
              }
              @keyframes bubbleRise {
                0% { 
                  transform: translateY(0);
                  opacity: 0.7;
                }
                50% {
                  opacity: 0.9;
                }
                100% { 
                  transform: translateY(-${fillHeight}px);
                  opacity: 0;
                }
              }
              @keyframes shimmer {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 0.6; }
              }
              @keyframes surfaceBob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-1.5px); }
              }
            `}</style>
            
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
              {/* Main water fill */}
              <rect 
                x="0" 
                y={fillY}
                width="100" 
                height={fillHeight + 10}
                fill="url(#bodyWaterGradient)"
                className="transition-all duration-700 ease-out"
              />
              
              {/* Animated wave surface */}
              {fillPercent > 5 && (
                <g style={{ animation: 'surfaceBob 2s ease-in-out infinite' }}>
                  {/* Primary wave */}
                  <ellipse 
                    cx="50" 
                    cy={fillY}
                    rx="45"
                    ry="4"
                    fill="hsl(195, 80%, 70%)"
                    opacity="0.5"
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Secondary wave highlight */}
                  <ellipse 
                    cx="50" 
                    cy={fillY - 1}
                    rx="40"
                    ry="2"
                    fill="url(#surfaceHighlight)"
                    className="transition-all duration-700 ease-out"
                  />
                  {/* Animated wave pattern */}
                  <rect
                    x="0"
                    y={fillY - 3}
                    width="100"
                    height="6"
                    fill="url(#wavePattern)"
                    style={{ animation: 'waveMove 1.5s linear infinite' }}
                  />
                </g>
              )}
              
              {/* Rising bubbles */}
              {bubbles.map((bubble, index) => (
                <circle 
                  key={index}
                  cx={bubble.cx} 
                  cy={180}
                  r={bubble.r} 
                  fill="white" 
                  opacity="0"
                  style={{ 
                    animation: `bubbleRise ${bubble.duration}s ease-out infinite`,
                    animationDelay: `${bubble.delay}s`
                  }}
                />
              ))}
              
              {/* Light reflections */}
              {reflections.map((reflection, index) => (
                <ellipse
                  key={index}
                  cx={reflection.cx}
                  cy={reflection.cy}
                  rx={reflection.rx}
                  ry={reflection.ry}
                  fill="url(#reflectionGradient)"
                  style={{ animation: 'shimmer 3s ease-in-out infinite', animationDelay: `${index * 0.5}s` }}
                />
              ))}
              
              {/* Inner glow/caustics effect */}
              {fillPercent > 20 && (
                <>
                  <ellipse
                    cx="45"
                    cy={fillY + fillHeight * 0.4}
                    rx="8"
                    ry="15"
                    fill="white"
                    opacity="0.1"
                    style={{ animation: 'shimmer 4s ease-in-out infinite' }}
                  />
                  <ellipse
                    cx="55"
                    cy={fillY + fillHeight * 0.6}
                    rx="6"
                    ry="12"
                    fill="white"
                    opacity="0.08"
                    style={{ animation: 'shimmer 4s ease-in-out infinite', animationDelay: '1s' }}
                  />
                </>
              )}
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
