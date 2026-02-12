/**
 * Interactive Mouth Diagram - clickable zones over the open mouth image
 */

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import openMouthImg from '@/assets/open-mouth.png';
import type { MouthAnnotation } from '@/types/oralHealth';

interface Props {
  annotations: MouthAnnotation[];
  onZoneClick: (location: string) => void;
}

interface MouthZone {
  id: string;
  label: string;
  /** CSS positioning as percentages of the container */
  top: string;
  left: string;
  width: string;
  height: string;
  borderRadius?: string;
}

const MOUTH_ZONES: MouthZone[] = [
  { id: 'Upper lip', label: 'Upper Lip', top: '2%', left: '20%', width: '60%', height: '14%', borderRadius: '50% 50% 0 0' },
  { id: 'Upper front teeth', label: 'Upper Front Teeth', top: '16%', left: '30%', width: '40%', height: '10%' },
  { id: 'Upper left molars', label: 'Upper Left Molars', top: '18%', left: '8%', width: '22%', height: '12%', borderRadius: '8px' },
  { id: 'Upper right molars', label: 'Upper Right Molars', top: '18%', left: '70%', width: '22%', height: '12%', borderRadius: '8px' },
  { id: 'Roof of mouth', label: 'Roof of Mouth', top: '28%', left: '25%', width: '50%', height: '12%', borderRadius: '0 0 50% 50%' },
  { id: 'Left cheek', label: 'Left Cheek', top: '40%', left: '2%', width: '16%', height: '20%', borderRadius: '8px' },
  { id: 'Right cheek', label: 'Right Cheek', top: '40%', left: '82%', width: '16%', height: '20%', borderRadius: '8px' },
  { id: 'Tongue tip', label: 'Tongue Tip', top: '55%', left: '32%', width: '36%', height: '12%', borderRadius: '50%' },
  { id: 'Tongue back', label: 'Tongue Back', top: '42%', left: '30%', width: '40%', height: '14%', borderRadius: '50% 50% 0 0' },
  { id: 'Lower front teeth', label: 'Lower Front Teeth', top: '68%', left: '30%', width: '40%', height: '10%' },
  { id: 'Lower left molars', label: 'Lower Left Molars', top: '66%', left: '8%', width: '22%', height: '12%', borderRadius: '8px' },
  { id: 'Lower right molars', label: 'Lower Right Molars', top: '66%', left: '70%', width: '22%', height: '12%', borderRadius: '8px' },
  { id: 'Gums upper', label: 'Gums (Upper)', top: '14%', left: '15%', width: '70%', height: '6%' },
  { id: 'Gums lower', label: 'Gums (Lower)', top: '78%', left: '15%', width: '70%', height: '6%' },
  { id: 'Lower lip', label: 'Lower Lip', top: '84%', left: '20%', width: '60%', height: '14%', borderRadius: '0 0 50% 50%' },
];

export function InteractiveMouthDiagram({ annotations, onZoneClick }: Props) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  const getAnnotationsForZone = (zoneId: string) =>
    annotations.filter(a => a.location === zoneId);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative w-full max-w-sm mx-auto select-none">
        <img
          src={openMouthImg}
          alt="Open mouth diagram for annotation"
          className="w-full h-auto pointer-events-none"
          draggable={false}
        />

        {/* Clickable overlay zones */}
        {MOUTH_ZONES.map((zone) => {
          const zoneAnnotations = getAnnotationsForZone(zone.id);
          const hasAnnotations = zoneAnnotations.length > 0;
          const isHovered = hoveredZone === zone.id;

          return (
            <Tooltip key={zone.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="absolute transition-all duration-150"
                  style={{
                    top: zone.top,
                    left: zone.left,
                    width: zone.width,
                    height: zone.height,
                    borderRadius: zone.borderRadius || '6px',
                    background: hasAnnotations
                      ? 'hsla(var(--destructive), 0.25)'
                      : isHovered
                        ? 'hsla(var(--primary), 0.15)'
                        : 'transparent',
                    border: hasAnnotations
                      ? '2px solid hsl(var(--destructive))'
                      : isHovered
                        ? '2px dashed hsl(var(--primary))'
                        : '1px solid transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => onZoneClick(zone.id)}
                  onMouseEnter={() => setHoveredZone(zone.id)}
                  onMouseLeave={() => setHoveredZone(null)}
                  aria-label={`Mark concern on ${zone.label}`}
                >
                  {hasAnnotations && (
                    <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow">
                      {zoneAnnotations.length}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[200px]">
                <p className="font-medium text-sm">{zone.label}</p>
                {hasAnnotations ? (
                  <ul className="text-xs mt-1 space-y-0.5">
                    {zoneAnnotations.map((a, i) => (
                      <li key={i} className="text-muted-foreground">
                        {a.issue_type}{a.notes ? ` – ${a.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">Tap to add concern</p>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Legend */}
        {annotations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
            {annotations.map((a, i) => (
              <Badge key={i} variant="outline" className="text-xs border-destructive/40 text-destructive">
                {a.location}: {a.issue_type}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
