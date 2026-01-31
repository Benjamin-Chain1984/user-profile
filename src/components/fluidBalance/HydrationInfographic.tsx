import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

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
  const fillPercent = Math.min(Math.max(percentOfTarget, 0), 100);
  
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
            viewBox="0 0 120 160" 
            className="w-40 h-52"
            aria-label={`Hydration level: ${fillPercent}%`}
          >
            {/* Glass container */}
            <defs>
              <clipPath id="glassClip">
                <path d="M20 20 L25 140 Q27 150 60 150 Q93 150 95 140 L100 20 Z" />
              </clipPath>
              <linearGradient id="waterGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="hsl(200, 80%, 50%)" stopOpacity="0.9" />
                <stop offset="50%" stopColor="hsl(200, 75%, 55%)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="hsl(200, 70%, 65%)" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="20%" stopColor="white" stopOpacity="0" />
                <stop offset="80%" stopColor="white" stopOpacity="0" />
                <stop offset="100%" stopColor="white" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            
            {/* Glass background */}
            <path 
              d="M20 20 L25 140 Q27 150 60 150 Q93 150 95 140 L100 20 Z" 
              fill="hsl(210, 20%, 95%)"
              stroke="hsl(210, 15%, 80%)"
              strokeWidth="2"
            />
            
            {/* Water fill */}
            <g clipPath="url(#glassClip)">
              <rect 
                x="15" 
                y={150 - (fillPercent / 100) * 130}
                width="90" 
                height={(fillPercent / 100) * 130}
                fill="url(#waterGradient)"
                className="transition-all duration-700 ease-out"
              />
              
              {/* Water surface wave effect */}
              {fillPercent > 5 && (
                <ellipse 
                  cx="60" 
                  cy={150 - (fillPercent / 100) * 130}
                  rx="38"
                  ry="4"
                  fill="hsl(200, 70%, 70%)"
                  opacity="0.6"
                />
              )}
              
              {/* Bubbles */}
              {fillPercent > 10 && (
                <>
                  <circle cx="40" cy={155 - (fillPercent / 100) * 100} r="3" fill="white" opacity="0.4" className="animate-pulse" />
                  <circle cx="75" cy={165 - (fillPercent / 100) * 110} r="2" fill="white" opacity="0.3" className="animate-pulse" style={{ animationDelay: '0.3s' }} />
                  <circle cx="55" cy={145 - (fillPercent / 100) * 90} r="2.5" fill="white" opacity="0.35" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
                </>
              )}
            </g>
            
            {/* Glass shine overlay */}
            <path 
              d="M20 20 L25 140 Q27 150 60 150 Q93 150 95 140 L100 20 Z" 
              fill="url(#glassShine)"
            />
            
            {/* Glass rim */}
            <ellipse cx="60" cy="20" rx="42" ry="8" fill="none" stroke="hsl(210, 15%, 75%)" strokeWidth="3" />
            <ellipse cx="60" cy="20" rx="40" ry="6" fill="hsl(210, 20%, 98%)" stroke="hsl(210, 15%, 85%)" strokeWidth="1" />
            
            {/* Measurement lines */}
            <line x1="98" y1="45" x2="105" y2="45" stroke="hsl(210, 15%, 70%)" strokeWidth="1" />
            <line x1="97" y1="80" x2="105" y2="80" stroke="hsl(210, 15%, 70%)" strokeWidth="1" />
            <line x1="96" y1="115" x2="105" y2="115" stroke="hsl(210, 15%, 70%)" strokeWidth="1" />
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
