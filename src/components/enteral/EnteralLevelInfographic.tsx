/**
 * Enteral Level Infographic - Visual level indicator for Formula and Flush volumes
 * Similar to Fluid Balance HydrationInfographic pattern
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Apple, Droplets } from 'lucide-react';

interface EnteralLevelInfographicProps {
  type: 'formula' | 'flush';
  currentMl: number;
  targetMl: number;
}

function generateBubbles(fillPercent: number): Array<{ cx: number; cy: number; r: number; delay: number; duration: number }> {
  if (fillPercent < 5) return [];
  const count = Math.min(Math.floor(fillPercent / 10), 8);
  const bubbles: Array<{ cx: number; cy: number; r: number; delay: number; duration: number }> = [];
  for (let i = 0; i < count; i++) {
    bubbles.push({
      cx: 25 + Math.random() * 50,
      cy: 0,
      r: 1 + Math.random() * 2,
      delay: i * 0.4 + Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5,
    });
  }
  return bubbles;
}

export const EnteralLevelInfographic: React.FC<EnteralLevelInfographicProps> = ({
  type,
  currentMl,
  targetMl,
}) => {
  const percent = targetMl > 0 ? Math.min(Math.max((currentMl / targetMl) * 100, 0), 100) : 0;
  const bubbles = useMemo(() => generateBubbles(percent), [percent]);

  const isFormula = type === 'formula';
  const title = isFormula ? 'Formula Level' : 'Flush Level';
  const Icon = isFormula ? Apple : Droplets;

  // Colors
  const colors = isFormula
    ? {
        deep: 'hsl(35, 80%, 45%)',
        mid: 'hsl(38, 75%, 50%)',
        light: 'hsl(40, 70%, 58%)',
        surface: 'hsl(42, 65%, 65%)',
        accent: 'hsl(35, 85%, 50%)',
      }
    : {
        deep: 'hsl(200, 85%, 45%)',
        mid: 'hsl(200, 80%, 50%)',
        light: 'hsl(195, 75%, 55%)',
        surface: 'hsl(190, 70%, 65%)',
        accent: 'hsl(200, 90%, 50%)',
      };

  const fillHeight = (percent / 100) * 120;
  const fillY = 160 - fillHeight;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="h-5 w-5" style={{ color: colors.accent }} />
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <svg
            viewBox="0 0 100 200"
            className="w-28 h-44"
            aria-label={`${title}: ${Math.round(percent)}%`}
          >
            <defs>
              <linearGradient id={`${type}WaterGrad`} x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor={colors.deep} stopOpacity="0.9" />
                <stop offset="40%" stopColor={colors.mid} stopOpacity="0.85" />
                <stop offset="80%" stopColor={colors.light} stopOpacity="0.75" />
                <stop offset="100%" stopColor={colors.surface} stopOpacity="0.6" />
              </linearGradient>
              <clipPath id={`${type}BagClip`}>
                {/* Feeding bag / bottle shape */}
                <path d="M35 15 L35 8 Q35 4 40 4 L60 4 Q65 4 65 8 L65 15 Q72 20 75 35 L75 150 Q75 160 65 160 L35 160 Q25 160 25 150 L25 35 Q28 20 35 15 Z" />
              </clipPath>
              <pattern id={`${type}Wave`} x="0" y="0" width="20" height="6" patternUnits="userSpaceOnUse">
                <path
                  d="M0 3 Q5 0 10 3 T20 3"
                  fill="none"
                  stroke={colors.surface}
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              </pattern>
            </defs>

            <style>{`
              @keyframes ${type}BubbleRise {
                0% { transform: translateY(0); opacity: 0.6; }
                100% { transform: translateY(-${fillHeight}px); opacity: 0; }
              }
              @keyframes ${type}WaveMove {
                0% { transform: translateX(0); }
                100% { transform: translateX(-20px); }
              }
              @keyframes ${type}Bob {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-1px); }
              }
            `}</style>

            {/* Bag outline */}
            <path
              d="M35 15 L35 8 Q35 4 40 4 L60 4 Q65 4 65 8 L65 15 Q72 20 75 35 L75 150 Q75 160 65 160 L35 160 Q25 160 25 150 L25 35 Q28 20 35 15 Z"
              fill="hsl(var(--muted))"
              stroke="hsl(var(--border))"
              strokeWidth="1.5"
              opacity="0.4"
            />

            {/* Graduation marks */}
            {[25, 50, 75, 100].map((mark) => {
              const markY = 160 - (mark / 100) * 120;
              return (
                <g key={mark}>
                  <line x1="26" y1={markY} x2="32" y2={markY} stroke="hsl(var(--border))" strokeWidth="0.8" opacity="0.5" />
                  <text x="23" y={markY + 2} fontSize="5" fill="hsl(var(--muted-foreground))" textAnchor="end" opacity="0.6">
                    {mark}%
                  </text>
                </g>
              );
            })}

            {/* Fill */}
            <g clipPath={`url(#${type}BagClip)`}>
              <rect
                x="0"
                y={fillY}
                width="100"
                height={fillHeight + 20}
                fill={`url(#${type}WaterGrad)`}
                className="transition-all duration-700 ease-out"
              />

              {/* Wave surface */}
              {percent > 3 && (
                <g style={{ animation: `${type}Bob 2s ease-in-out infinite` }}>
                  <ellipse
                    cx="50"
                    cy={fillY}
                    rx="30"
                    ry="3"
                    fill={colors.surface}
                    opacity="0.4"
                    className="transition-all duration-700 ease-out"
                  />
                  <rect
                    x="20"
                    y={fillY - 3}
                    width="60"
                    height="6"
                    fill={`url(#${type}Wave)`}
                    style={{ animation: `${type}WaveMove 1.5s linear infinite` }}
                  />
                </g>
              )}

              {/* Bubbles */}
              {bubbles.map((b, i) => (
                <circle
                  key={i}
                  cx={b.cx}
                  cy={160}
                  r={b.r}
                  fill="white"
                  opacity="0"
                  style={{
                    animation: `${type}BubbleRise ${b.duration}s ease-out infinite`,
                    animationDelay: `${b.delay}s`,
                  }}
                />
              ))}
            </g>

            {/* Tube/spout at bottom */}
            <rect x="46" y="158" width="8" height="20" rx="2" fill="hsl(var(--border))" opacity="0.5" />

            {/* Hang hook at top */}
            <path d="M45 4 Q50 -2 55 4" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.5" />
          </svg>
        </div>

        {/* Stats */}
        <div className="text-center mt-3 space-y-1">
          <p className="text-2xl font-bold" style={{ color: colors.accent }}>
            {Math.round(percent)}%
          </p>
          <p className="text-sm text-muted-foreground">
            {currentMl}ml of {targetMl}ml
          </p>
          <p className="text-xs text-muted-foreground">
            {isFormula ? 'Formula delivered' : 'Water flushes given'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
